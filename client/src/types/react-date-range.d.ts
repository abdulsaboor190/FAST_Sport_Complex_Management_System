declare module 'react-date-range' {
  import type { FC } from 'react';

  export type Range = {
    startDate?: Date;
    endDate?: Date;
    key?: string;
    color?: string;
    disabled?: boolean;
  };

  export type RangeKeyDict = { [key: string]: Range };

  export interface DateRangeProps {
    ranges: Range[];
    onChange: (ranges: RangeKeyDict) => void;
    showSelectionPreview?: boolean;
    moveRangeOnFirstSelection?: boolean;
    months?: number;
    direction?: 'horizontal' | 'vertical';
    rangeColors?: string[];
  }

  export const DateRange: FC<DateRangeProps>;
}

