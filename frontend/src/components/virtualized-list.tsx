"use client";

import { List } from "react-window";
import type { RowComponentProps } from "react-window";
import { cn } from "@/src/lib/cn";

type RowData<T> = {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
};

export function VirtualizedList<T>({
  items,
  height = 360,
  rowHeight = 72,
  className,
  render,
}: {
  items: T[];
  height?: number;
  rowHeight?: number;
  className?: string;
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <List
      className={cn("scrollbar-thin", className)}
      defaultHeight={height}
      rowCount={items.length}
      rowHeight={rowHeight}
      overscanCount={8}
      rowProps={{ items, render }}
      rowComponent={VirtualRow<T>}
      style={{ height, width: "100%" }}
    />
  );
}

function VirtualRow<T>({ index, style, items, render, ariaAttributes }: RowComponentProps<RowData<T>>) {
  return (
    <div style={style} {...ariaAttributes}>
      {render(items[index], index)}
    </div>
  );
}
