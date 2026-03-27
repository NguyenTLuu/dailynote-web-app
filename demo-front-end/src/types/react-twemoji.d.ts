declare module 'react-twemoji' {
  import { ReactNode, ComponentType } from 'react';
  
  interface TwemojiProps {
    children?: ReactNode;
    options?: {
      className?: string;
      ext?: string;
      folder?: string;
      size?: string;
      base?: string;
    };
    [key: string]: any;
  }
  
  const Twemoji: ComponentType<TwemojiProps>;
  export default Twemoji;
}
