import { afterEach, describe, expect, it } from 'vitest';
import { SubstackProvider } from '../social.adapter';

const provider = new SubstackProvider();
afterEach(() => { delete process.env.POSTMILL_SUBSTACK_BRIDGE_URL; });

describe('Substack preview provider', () => {
  it('rejects missing or malformed bridge credentials', async () => {
    expect(await provider.authenticate({ code: 'bad', codeVerifier: '' })).toBe('Invalid Substack bridge credentials');
    const code = Buffer.from(JSON.stringify({ publicationId: 'test', bridgeToken: 'too-short' })).toString('base64');
    expect(await provider.authenticate({ code, codeVerifier: '' })).toBe('Invalid Substack bridge credentials');
  });
  it('rejects media and unsupported multi-part posts', async () => {
    expect(await provider.checkValidity([[{ path: 'image.png' }]])).toMatch(/text only/);
    await expect(provider.post('', '', [], {} as any)).rejects.toThrow(/one article/);
  });
  it('fails closed when the service is not configured', async () => {
    const code = Buffer.from(JSON.stringify({ publicationId: 'test', bridgeToken: 'a'.repeat(32) })).toString('base64');
    expect(await provider.authenticate({ code, codeVerifier: '' })).toBe('Substack browser bridge is unavailable');
  });
});
