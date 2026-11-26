import { Allow, IsDefined, IsString, MinLength } from 'class-validator';
export class SubstackSettingsDto {
  @Allow() __type?: string;
  @IsString() @IsDefined() @MinLength(2) title: string;
}
