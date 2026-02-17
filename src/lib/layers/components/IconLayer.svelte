<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Star } from '@lucide/svelte';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';

  /**
   * Common Lucide icon names for motion graphics
   */
  const CommonIcons = {
    // Arrows & Navigation
    ArrowRight: 'arrow-right',
    ArrowLeft: 'arrow-left',
    ArrowUp: 'arrow-up',
    ArrowDown: 'arrow-down',
    ChevronRight: 'chevron-right',
    ChevronLeft: 'chevron-left',
    ChevronUp: 'chevron-up',
    ChevronDown: 'chevron-down',

    // Actions
    Check: 'check',
    X: 'x',
    Plus: 'plus',
    Minus: 'minus',
    Play: 'play',
    Pause: 'pause',
    Download: 'download',
    Upload: 'upload',
    Share: 'share',
    Send: 'send',
    Copy: 'copy',
    Trash: 'trash',
    Edit: 'edit',
    Search: 'search',

    // Objects
    Star: 'star',
    Heart: 'heart',
    Bell: 'bell',
    Home: 'home',
    Settings: 'settings',
    User: 'user',
    Users: 'users',
    Mail: 'mail',
    Phone: 'phone',
    Calendar: 'calendar',
    Clock: 'clock',
    Lock: 'lock',
    Unlock: 'unlock',
    Key: 'key',
    Shield: 'shield',
    Zap: 'zap',
    Sparkles: 'sparkles',
    Rocket: 'rocket',
    Target: 'target',
    Award: 'award',
    Trophy: 'trophy',
    Gift: 'gift',
    Camera: 'camera',
    Image: 'image',
    Video: 'video',
    Music: 'music',
    Mic: 'mic',
    Volume2: 'volume-2',
    Wifi: 'wifi',
    Cloud: 'cloud',
    Database: 'database',
    Server: 'server',
    Code: 'code',
    Terminal: 'terminal',
    Globe: 'globe',
    MapPin: 'map-pin',
    Compass: 'compass',
    Sun: 'sun',
    Moon: 'moon',
    Lightbulb: 'lightbulb',
    Flame: 'flame',
    Bookmark: 'bookmark',
    Tag: 'tag',
    Hash: 'hash',
    AtSign: 'at-sign',
    Link: 'link',
    ExternalLink: 'external-link',
    Paperclip: 'paperclip',

    // Shapes & UI
    Circle: 'circle',
    Square: 'square',
    Triangle: 'triangle',
    Hexagon: 'hexagon',
    Menu: 'menu',
    MoreHorizontal: 'more-horizontal',
    MoreVertical: 'more-vertical',
    Grid: 'grid',
    Layout: 'layout',
    Layers: 'layers',
    Box: 'box',
    Package: 'package',
    Fullscreen: 'fullscreen',

    // Brands & Social (generic names)
    Github: 'github',
    Twitter: 'twitter',
    Facebook: 'facebook',
    Instagram: 'instagram',
    Linkedin: 'linkedin',
    Youtube: 'youtube'
  } as const;

  type CommonIcon = (typeof CommonIcons)[keyof typeof CommonIcons];

  const commonIconValues = Object.values(CommonIcons) as [CommonIcon, ...CommonIcon[]];

  /**
   * Schema for Icon Layer custom properties
   */
  const schema = z.object({
    icon: z
      .enum(commonIconValues)
      .default('star')
      .describe(
        'The icon name from Lucide icon library. Choose from common icons like arrows, actions, objects, shapes, and social media symbols. Changes discretely (no smooth animation between different icons).'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Icon' }),
    size: z
      .number()
      .min(16)
      .max(512)
      .default(64)
      .describe(
        'The icon size in pixels. Determines both width and height of the icon. Smoothly animatable for scaling effects.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'Size' }),
    color: z
      .string()
      .default('#ffffff')
      .describe(
        'The stroke/outline color of the icon in hexadecimal format. Defines the line color for the icon paths. Smoothly animatable for color transitions.'
      )
      .register(fieldRegistry, {
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Stroke'
      }),
    strokeWidth: z
      .number()
      .min(0.5)
      .max(4)
      .default(2)
      .describe(
        'The thickness of the icon stroke/outline in pixels. Lower values create thinner lines, higher values create bolder icons. Smoothly animatable.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'Stroke Width' }),
    fill: z
      .string()
      .default('none')
      .describe(
        'The fill color inside the icon shapes in hexadecimal format. Use "none" for outline-only icons, or a color hex (e.g., #ff0000) to fill the icon interior. Smoothly animatable between colors.'
      )
      .register(fieldRegistry, {
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Fill'
      }),
    backgroundColor: z
      .string()
      .default('transparent')
      .describe(
        'The background color behind the icon in hexadecimal format. Use "transparent" for no background, or a color (e.g., #000000) to add a background shape. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Background'
      }),
    backgroundRadius: z
      .number()
      .min(0)
      .max(256)
      .default(0)
      .describe(
        'The border radius of the background shape in pixels. 0 = square background, higher values = more rounded. Use size/2 for circular backgrounds. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        interpolationFamily: 'continuous',
        label: 'Background Radius'
      }),
    backgroundPadding: z
      .number()
      .min(0)
      .max(64)
      .default(0)
      .describe(
        'The padding/spacing between the icon and its background edge in pixels. Increases the background size without affecting icon size. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        interpolationFamily: 'continuous',
        label: 'Background Padding'
      })
  });

  export const meta = {
    category: 'shape',
    schema,
    type: 'icon',
    label: 'Icon',
    icon: Star,
    description: 'Lucide icons with customizable size, color, stroke, and optional background'
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import * as Icons from '@lucide/svelte';

  let {
    icon,
    size,
    color,
    strokeWidth,
    fill,
    backgroundColor,
    backgroundRadius,
    backgroundPadding
  }: Props = $props();

  // Map icon name to component
  const iconMap: Record<string, typeof Icons.Star> = {
    // Arrows & Navigation
    'arrow-right': Icons.ArrowRight,
    'arrow-left': Icons.ArrowLeft,
    'arrow-up': Icons.ArrowUp,
    'arrow-down': Icons.ArrowDown,
    'chevron-right': Icons.ChevronRight,
    'chevron-left': Icons.ChevronLeft,
    'chevron-up': Icons.ChevronUp,
    'chevron-down': Icons.ChevronDown,

    // Actions
    check: Icons.Check,
    x: Icons.X,
    plus: Icons.Plus,
    minus: Icons.Minus,
    play: Icons.Play,
    pause: Icons.Pause,
    download: Icons.Download,
    upload: Icons.Upload,
    share: Icons.Share,
    send: Icons.Send,
    copy: Icons.Copy,
    trash: Icons.Trash,
    edit: Icons.Edit,
    search: Icons.Search,

    // Objects
    star: Icons.Star,
    heart: Icons.Heart,
    bell: Icons.Bell,
    home: Icons.Home,
    settings: Icons.Settings,
    user: Icons.User,
    users: Icons.Users,
    mail: Icons.Mail,
    phone: Icons.Phone,
    calendar: Icons.Calendar,
    clock: Icons.Clock,
    lock: Icons.Lock,
    unlock: Icons.Unlock,
    key: Icons.Key,
    shield: Icons.Shield,
    zap: Icons.Zap,
    sparkles: Icons.Sparkles,
    rocket: Icons.Rocket,
    target: Icons.Target,
    award: Icons.Award,
    trophy: Icons.Trophy,
    gift: Icons.Gift,
    camera: Icons.Camera,
    image: Icons.Image,
    video: Icons.Video,
    music: Icons.Music,
    mic: Icons.Mic,
    'volume-2': Icons.Volume2,
    wifi: Icons.Wifi,
    cloud: Icons.Cloud,
    database: Icons.Database,
    server: Icons.Server,
    code: Icons.Code,
    terminal: Icons.Terminal,
    globe: Icons.Globe,
    'map-pin': Icons.MapPin,
    compass: Icons.Compass,
    sun: Icons.Sun,
    moon: Icons.Moon,
    lightbulb: Icons.Lightbulb,
    flame: Icons.Flame,
    bookmark: Icons.Bookmark,
    tag: Icons.Tag,
    hash: Icons.Hash,
    'at-sign': Icons.AtSign,
    link: Icons.Link,
    'external-link': Icons.ExternalLink,
    paperclip: Icons.Paperclip,

    // Shapes & UI
    circle: Icons.Circle,
    square: Icons.Square,
    triangle: Icons.Triangle,
    hexagon: Icons.Hexagon,
    menu: Icons.Menu,
    'more-horizontal': Icons.MoreHorizontal,
    'more-vertical': Icons.MoreVertical,
    grid: Icons.Grid,
    layout: Icons.Layout,
    layers: Icons.Layers,
    box: Icons.Box,
    package: Icons.Package,

    // Brands
    github: Icons.Github,
    twitter: Icons.Twitter,
    facebook: Icons.Facebook,
    instagram: Icons.Instagram,
    linkedin: Icons.Linkedin,
    youtube: Icons.Youtube,
    fullscreen: Icons.Fullscreen
  };

  const IconComponent = $derived(iconMap[icon] || Icons.Star);
  const totalSize = $derived(size + backgroundPadding * 2);
</script>

<div
  class="flex items-center justify-center"
  style:width="{totalSize}px"
  style:height="{totalSize}px"
  style:background-color={backgroundColor}
  style:border-radius="{backgroundRadius}px"
>
  <IconComponent {size} {color} stroke-width={strokeWidth} {fill} />
</div>
