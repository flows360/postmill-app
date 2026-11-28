'use client';
import { FC } from 'react';
import { withProvider, PostComment } from '@postmill-ai/frontend/components/composer/providers/high.order.provider';
import { SubstackSettingsDto } from '@postmill-ai/nestjs-libraries/dtos/posts/providers-settings/substack.dto';
import { Input } from '@postmill-ai/react/form/input';
import { useSettings } from '@postmill-ai/frontend/components/launches/helpers/use.values';
const Settings: FC = () => { const form = useSettings(); return <Input label="Title" {...form.register('title')} />; };
export default withProvider({ postComment: PostComment.POST, minimumCharacters: [], SettingsComponent: Settings, CustomPreviewComponent: undefined, dto: SubstackSettingsDto, maximumCharacters: 100000 });
