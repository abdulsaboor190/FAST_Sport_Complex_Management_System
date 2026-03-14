declare module 'react-rating-stars-component' {
  import type { FC } from 'react';
  interface ReactStarsProps {
    count?: number;
    value?: number;
    size?: number;
    edit?: boolean;
    isHalf?: boolean;
    onChange?: (value: number) => void;
  }
  const ReactStars: FC<ReactStarsProps>;
  export default ReactStars;
}
