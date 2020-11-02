import { Options } from './option.model';

export const USER_STATUS: Options = [
  { value: 1, label: 'Enabled' },
  { value: 0, label: 'Disabled' }
];

export class User {
  id: string;
  username: string;
  avatar: string;
  avatarURL: string;
  email: string;
  status: number;
  statusLabel: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  passwordNew: string;
  accessToken: string;
}
