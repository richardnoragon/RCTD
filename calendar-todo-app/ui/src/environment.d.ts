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
