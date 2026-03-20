import React from 'react';

export const AVATARS = [
  { id: 'avatar-1', colors: ['#4F8EF7', '#2563EB'], emoji: true },
  { id: 'avatar-2', colors: ['#F5C842', '#D97706'], emoji: true },
  { id: 'avatar-3', colors: ['#F05252', '#B91C1C'], emoji: true },
  { id: 'avatar-4', colors: ['#1C3A4A', '#0E7490'], emoji: true },
  { id: 'avatar-5', colors: ['#7C3AED', '#5B21B6'], emoji: true },
  { id: 'avatar-6', colors: ['#059669', '#047857'], emoji: true },
  { id: 'avatar-7', colors: ['#EC4899', '#BE185D'], emoji: true },
  { id: 'avatar-8', colors: ['#F97316', '#C2410C'], emoji: true },
  { id: 'avatar-9', colors: ['#6366F1', '#4338CA'], emoji: true },
  { id: 'avatar-10', colors: ['#14B8A6', '#0F766E'], emoji: true },
  { id: 'avatar-11', colors: ['#84CC16', '#4D7C0F'], emoji: true },
  { id: 'avatar-12', colors: ['#F43F5E', '#BE123C'], emoji: true },
];

export function AvatarDisplay({ avatarId, size = 64, className = '' }) {
  const avatar = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];

  return React.createElement(
    'div',
    {
      className: `relative overflow-hidden rounded-2xl flex items-center justify-center ${className}`,
      style: {
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${avatar.colors[0]}, ${avatar.colors[1]})`,
      },
    },
    React.createElement(
      'svg',
      {
        viewBox: '0 0 40 40',
        fill: 'none',
        style: { width: size * 0.7, height: size * 0.7 },
      },
      React.createElement('circle', { cx: '14', cy: '16', r: '2.5', fill: 'white', opacity: '0.9' }),
      React.createElement('circle', { cx: '26', cy: '16', r: '2.5', fill: 'white', opacity: '0.9' }),
      React.createElement('path', {
        d: 'M13 24 Q20 30 27 24',
        stroke: 'white',
        strokeWidth: '2.2',
        strokeLinecap: 'round',
        fill: 'none',
        opacity: '0.9',
      })
    )
  );
}
