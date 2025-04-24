declare module 'react' {
  export = React;
  export as namespace React;

  namespace React {
    type FC<P = {}> = FunctionComponent<P>;
    interface FunctionComponent<P = {}> {
      (props: P & { children?: React.ReactNode }): React.ReactElement | null;
    }
    type ReactNode = ReactElement | string | number | boolean | null | undefined;
    interface ReactElement<P = any> {
      type: string | FC<P>;
      props: P;
      key: string | number | null;
    }
    interface Attributes {
      key?: string | number;
    }
    interface ClassAttributes<T> extends Attributes {
      ref?: React.Ref<T>;
    }
    type Ref<T> = { current: T | null };
    type HTMLAttributes<T> = {
      className?: string;
      onClick?: (event: any) => void;
      onChange?: (event: any) => void;
      value?: string | number;
      style?: { [key: string]: string | number };
    };
    type DetailedHTMLProps<E extends HTMLAttributes<T>, T> = E;
  }
}

declare namespace JSX {
  interface Element extends React.ReactElement<any> {}
  interface IntrinsicElements {
    div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    button: React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
    h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
    p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
    input: React.DetailedHTMLProps<React.HTMLAttributes<HTMLInputElement>, HTMLInputElement>;
    select: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
    option: React.DetailedHTMLProps<React.HTMLAttributes<HTMLOptionElement>, HTMLOptionElement>;
  }
}

declare module '*.css' {
  const css: { [key: string]: string };
  export default css;
}

declare module '@fullcalendar/react' {
  const FullCalendar: React.FC<any>;
  export default FullCalendar;
}

declare module '@fullcalendar/daygrid' {
  const Plugin: any;
  export default Plugin;
}

declare module '@fullcalendar/timegrid' {
  const Plugin: any;
  export default Plugin;
}

declare module '@fullcalendar/list' {
  const Plugin: any;
  export default Plugin;
}

declare module '@fullcalendar/interaction' {
  const Plugin: any;
  export default Plugin;
}
