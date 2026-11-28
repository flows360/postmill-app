import {
  AuthTokenDetails, ChannelSetupDescriptor, PostDetails, PostResponse,
  ProviderModule, SocialAbstract, SocialProvider, SocialProviderKernelAdapter,
  SubstackSettingsDto, PROVIDER_CAPABILITIES, makeOauthState,
} from '@postmill-ai/provider-kernel';
import { Integration } from '@prisma/client';
import { metadata } from './metadata';

type VerifiedPublication = { id: string; name: string; hostname: string; username?: string };
type PublishOutcome = { status: 'completed'; id: string; url: string };

/** A fixed operator-owned HTTPS service, never a user-supplied URL. */
function bridgeUrl(): string {
  const value = process.env.POSTMILL_SUBSTACK_BRIDGE_URL;
  if (!value) throw new Error('Substack browser bridge is not configured');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Substack browser bridge must be a bare HTTPS origin');
  }
  return url.origin;
}

export class SubstackProvider extends SocialAbstract implements SocialProvider {
  identifier = 'substack';
  name = 'Substack';
  editor = 'markdown' as const;
  scopes: string[] = [];
  isBetweenSteps = false;
  override maxConcurrentJob = 1;
  dto = SubstackSettingsDto;
  override setupDescriptor: ChannelSetupDescriptor = {
    authType: 'direct', credentialFields: [], portalUrl: 'https://substack.com', portalLabel: 'Substack',
    setupSteps: [
      'Ask the Flows360 RPA administrator to connect the publication in the server browser.',
      'Ask for a publication-specific Postmill bridge token and publication ID. Do not use an RPA administrator key.',
      'Connect the Substack channel in Postmill using those two values.',
      'Run a draft-only browser check before enabling publication.',
    ],
  };
  maxLength() { return 100000; }
  override async checkValidity(media: Array<{ path: string }[]>): Promise<string | true> {
    return media.some((part) => part.length) ? 'Substack bridge currently accepts text only' : true;
  }
  async customFields() {
    return [
      { key: 'publicationId', label: 'Publication ID', validation: '/^.{1,128}$/', type: 'text' as const },
      { key: 'bridgeToken', label: 'Publication bridge token', validation: '/^.{24,}$/', type: 'password' as const },
    ];
  }
  async generateAuthUrl() {
    const state = makeOauthState();
    return { url: state, codeVerifier: '', state };
  }
  async authenticate({ code }: { code: string; codeVerifier: string }) {
    let credentials: { publicationId: string; bridgeToken: string };
    try {
      credentials = JSON.parse(Buffer.from(code, 'base64').toString('utf8'));
      if (typeof credentials.publicationId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(credentials.publicationId) ||
          typeof credentials.bridgeToken !== 'string' || credentials.bridgeToken.length < 24) return 'Invalid Substack bridge credentials';
    } catch { return 'Invalid Substack bridge credentials'; }
    try {
      const response = await this.fetch(`${bridgeUrl()}/v1/postmill/substack/publications/${encodeURIComponent(credentials.publicationId)}`, {
        headers: { Authorization: `Bearer ${credentials.bridgeToken}` },
      });
      if (!response.ok) return 'Substack publication is not connected in the browser bridge';
      const publication = await response.json() as VerifiedPublication;
      if (publication.id !== credentials.publicationId || !publication.name || !publication.hostname ||
          !publication.hostname.endsWith('.substack.com')) return 'Substack bridge returned an unverified publication';
      return {
        id: publication.id, name: publication.name, username: publication.username || publication.hostname,
        picture: '', accessToken: credentials.bridgeToken, refreshToken: '', expiresIn: 3153600000,
      };
    } catch { return 'Substack browser bridge is unavailable'; }
  }
  async refreshToken(): Promise<AuthTokenDetails> {
    return { id: '', name: '', username: '', picture: '', accessToken: '', refreshToken: '', expiresIn: 0 };
  }
  async post(id: string, accessToken: string, postDetails: PostDetails[], integration: Integration): Promise<PostResponse[]> {
    const [first] = postDetails;
    if (!first || postDetails.length !== 1 || !first.message?.trim() ||
        typeof first.settings?.title !== 'string' || !first.settings.title.trim()) {
      throw new Error('Substack requires one article with a title and body');
    }
    if (first.media?.length || first.poll || first.firstComment) throw new Error('Substack bridge accepts text articles only');
    const publicationId = integration.internalId;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(publicationId)) throw new Error('Invalid Substack publication identity');
    // The bridge must persist an idempotency key before touching the browser and return
    // only after reading the public URL from the selected publication. An ambiguous
    // outcome is an error, never a successful Postmill publish.
    const response = await this.fetch(`${bridgeUrl()}/v1/postmill/substack/publications/${encodeURIComponent(publicationId)}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Idempotency-Key': first.id },
      body: JSON.stringify({ jobId: first.id, title: first.settings.title, body: first.message, delivery: 'web-only' }),
    });
    if (!response.ok) throw new Error(`Substack bridge did not confirm publication (HTTP ${response.status})`);
    const outcome = await response.json() as PublishOutcome;
    if (outcome.status !== 'completed' || !outcome.id || !outcome.url) throw new Error('Substack publication is not confirmed');
    const url = new URL(outcome.url);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.substack.com') ||
        (integration.profile?.endsWith('.substack.com') && url.hostname !== integration.profile) ||
        url.username || url.password) {
      throw new Error('Substack bridge returned an invalid public URL');
    }
    return [{ id: first.id, postId: outcome.id, releaseURL: url.toString(), status: 'completed' }];
  }
}

const adapter = new SubstackProvider();
export const substackSocialModule: ProviderModule<any, any> = {
  metadata,
  manifest: {
    domain: 'social', providerId: adapter.identifier, version: 'v1', displayName: adapter.name,
    status: 'preview', credentialFields: [], capabilities: PROVIDER_CAPABILITIES[adapter.identifier],
  },
  create: (ctx) => new SocialProviderKernelAdapter(adapter, ctx),
};
