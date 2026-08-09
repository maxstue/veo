import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react';

import { cn } from '#/lib/utils';

import { type Theme, useTheme } from './theme-provider';
import { buttonVariants } from './ui/button';

const themeDetails = {
  system: { icon: Monitor, label: 'System' },
  light: { icon: Sun, label: 'Light' },
  dark: { icon: Moon, label: 'Dark' },
} satisfies Record<Theme, { icon: typeof Monitor; label: string }>;

const themes: Theme[] = ['system', 'light', 'dark'];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const details = themeDetails[theme];
  const ActiveIcon = details.icon;

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Theme auswählen. Aktuell: ${details.label}`}
        className={cn(
          buttonVariants({ size: 'sm', variant: 'outline' }),
          'group/theme-trigger w-16 justify-between sm:w-28',
        )}
        title={`Theme: ${details.label}`}
      >
        <ActiveIcon aria-hidden='true' />
        <span className='hidden sm:inline'>{details.label}</span>
        <ChevronDown
          className='transition-transform group-data-[popup-open]/theme-trigger:rotate-180'
          aria-hidden='true'
        />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align='end' className='z-50 outline-none' sideOffset={6}>
          <Menu.Popup className='bg-popover text-popover-foreground shadow-foreground/10 w-40 origin-[var(--transform-origin)] rounded-xl border p-1.5 shadow-xl transition-[transform,scale,opacity] outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none'>
            <Menu.RadioGroup aria-label='Theme' onValueChange={(value) => setTheme(value as Theme)} value={theme}>
              {themes.map((value) => {
                const option = themeDetails[value];
                const Icon = option.icon;

                return (
                  <Menu.RadioItem
                    className={cn(
                      'flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none',
                      'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
                      'data-checked:font-medium',
                    )}
                    closeOnClick
                    key={value}
                    value={value}
                  >
                    <Icon className='text-muted-foreground size-4' aria-hidden='true' />
                    <span className='flex-1'>{option.label}</span>
                    <Menu.RadioItemIndicator>
                      <Check className='text-primary size-4' strokeWidth={2.5} aria-hidden='true' />
                    </Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                );
              })}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
