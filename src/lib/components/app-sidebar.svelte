<script lang="ts">
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import BotIcon from '@lucide/svelte/icons/bot';
  import ChartPieIcon from '@lucide/svelte/icons/chart-pie';
  import FrameIcon from '@lucide/svelte/icons/frame';
  import LifeBuoyIcon from '@lucide/svelte/icons/life-buoy';
  import MapIcon from '@lucide/svelte/icons/map';
  import SendIcon from '@lucide/svelte/icons/send';
  import Settings2Icon from '@lucide/svelte/icons/settings-2';
  import SquareTerminalIcon from '@lucide/svelte/icons/square-terminal';
  import NavMain from './nav-main.svelte';
  import NavProjects from './nav-projects.svelte';
  import NavSecondary from './nav-secondary.svelte';
  import NavUser from './nav-user.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import CommandIcon from '@lucide/svelte/icons/command';
  import type { Component, ComponentProps } from 'svelte';
  import { getSession } from '$lib/context.svelte';
  import type { User } from 'better-auth';
  import Button from './ui/button/button.svelte';

  const session = getSession();

  const data: {
    navMain: {
      title: string;
      url: string;
      icon: Component;
      isActive?: boolean;
      items: {
        title: string;
        url: string;
      }[];
    }[];
    navSecondary: {
      title: string;
      url: string;
      icon: Component;
    }[];
    projects: {
      name: string;
      url: string;
      icon: Component;
    }[];
  } = {
    navMain: [
      {
        title: 'Playground',
        url: '#',
        icon: SquareTerminalIcon,
        isActive: true,
        items: [
          {
            title: 'History',
            url: '#'
          },
          {
            title: 'Starred',
            url: '#'
          },
          {
            title: 'Settings',
            url: '#'
          }
        ]
      },
      {
        title: 'Models',
        url: '#',
        icon: BotIcon,
        items: [
          {
            title: 'Genesis',
            url: '#'
          },
          {
            title: 'Explorer',
            url: '#'
          },
          {
            title: 'Quantum',
            url: '#'
          }
        ]
      },
      {
        title: 'Documentation',
        url: '#',
        icon: BookOpenIcon,
        items: [
          {
            title: 'Introduction',
            url: '#'
          },
          {
            title: 'Get Started',
            url: '#'
          },
          {
            title: 'Tutorials',
            url: '#'
          },
          {
            title: 'Changelog',
            url: '#'
          }
        ]
      },
      {
        title: 'Settings',
        url: '#',
        icon: Settings2Icon,
        items: [
          {
            title: 'General',
            url: '#'
          },
          {
            title: 'Team',
            url: '#'
          },
          {
            title: 'Billing',
            url: '#'
          },
          {
            title: 'Limits',
            url: '#'
          }
        ]
      }
    ],
    navSecondary: [
      {
        title: 'Support',
        url: '#',
        icon: LifeBuoyIcon
      },
      {
        title: 'Feedback',
        url: '#',
        icon: SendIcon
      }
    ],
    projects: [
      {
        name: 'Design Engineering',
        url: '#',
        icon: FrameIcon
      },
      {
        name: 'Sales & Marketing',
        url: '#',
        icon: ChartPieIcon
      },
      {
        name: 'Travel',
        url: '#',
        icon: MapIcon
      }
    ]
  };

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref variant="inset" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props })}
            <a href="##" {...props}>
              <div
                class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
              >
                <CommandIcon class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">Acme Inc</span>
                <span class="truncate text-xs">Enterprise</span>
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <NavMain items={data.navMain} />
    <NavProjects projects={data.projects} />
    <NavSecondary items={data.navSecondary} class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    {@const user = session.user}
    {#if user}
      <NavUser
        user={{
          name: user.name ?? '',
          email: user.email ?? '',
          avatar: user.image ?? ''
        }}
      />
    {:else}
      <Button href="/login" variant="outline" size="sm" class="w-full">Login</Button>
    {/if}
  </Sidebar.Footer>
</Sidebar.Root>
