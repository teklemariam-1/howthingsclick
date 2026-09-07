import { Slider as SliderPrimitive } from '@base-ui/react/slider';

// Compose the existing slider primitive so the accessible name reaches the
// focusable range input, rather than only its surrounding div.
export function CarSlider({
  'aria-label': label,
  ...props
}: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root {...props} data-slot="slider" thumbAlignment="edge">
      <SliderPrimitive.Control className="car-slider-control">
        <SliderPrimitive.Track data-slot="slider-track">
          <SliderPrimitive.Indicator data-slot="slider-range" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          getAriaLabel={() => label ?? 'Value'}
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
