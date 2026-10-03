import * as React from "react";

import { cn } from "@/lib/utils";

/** Plain data table: rows separated by hairlines, numbers right-aligned. */

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse type-body", className)} {...props} />
    </div>
  );
}

function TableHeader(props: React.ComponentProps<"thead">) {
  return <thead {...props} />;
}

function TableBody(props: React.ComponentProps<"tbody">) {
  return <tbody {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return <tfoot className={cn("border-t-2 border-border-strong font-medium", className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("border-b last:border-b-0", className)} {...props} />;
}

function TableHead({
  className,
  numeric,
  ...props
}: React.ComponentProps<"th"> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "h-10 px-4 text-left align-middle type-overline text-muted-foreground first:pl-0 last:pr-0",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  numeric,
  ...props
}: React.ComponentProps<"td"> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "h-12 px-4 align-middle first:pl-0 last:pr-0",
        numeric && "text-right tabular",
        className,
      )}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell };
