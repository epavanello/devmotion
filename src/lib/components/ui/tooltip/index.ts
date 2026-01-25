import { Tooltip as TooltipPrimitive } from 'bits-ui';
import Trigger from './tooltip-trigger.svelte';
import Content from './tooltip-content.svelte';
import Tooltip from './tooltip.svelte';

const Root = TooltipPrimitive.Root;
const Provider = TooltipPrimitive.Provider;
const Portal = TooltipPrimitive.Portal;

export {
  Tooltip,
  Root,
  Trigger,
  Content,
  Provider,
  Portal,
  //
  Root as TooltipRoot,
  Content as TooltipContent,
  Trigger as TooltipTrigger,
  Provider as TooltipProvider,
  Portal as TooltipPortal
};

export default Tooltip;
