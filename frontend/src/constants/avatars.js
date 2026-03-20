export const AVATARS = [
  { id: 'avatar-1', gradient: 'from-violet-500 to-purple-700' },
  { id: 'avatar-2', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'avatar-3', gradient: 'from-emerald-500 to-teal-700' },
  { id: 'avatar-4', gradient: 'from-rose-500 to-pink-700' },
  { id: 'avatar-5', gradient: 'from-amber-400 to-orange-600' },
  { id: 'avatar-6', gradient: 'from-sky-400 to-blue-600' },
  { id: 'avatar-7', gradient: 'from-fuchsia-500 to-purple-600' },
  { id: 'avatar-8', gradient: 'from-red-500 to-rose-700' },
  { id: 'avatar-9', gradient: 'from-green-400 to-emerald-600' },
  { id: 'avatar-10', gradient: 'from-indigo-500 to-violet-700' },
  { id: 'avatar-11', gradient: 'from-cyan-400 to-teal-600' },
  { id: 'avatar-12', gradient: 'from-orange-400 to-amber-600' },
];

export const getAvatarById = (avatarId) => AVATARS.find((avatar) => avatar.id === avatarId) || AVATARS[0];
