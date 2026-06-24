import { useEffect } from 'react';

const SUFFIX = ' — The Scribe';

export default function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title}${SUFFIX}` : 'The Scribe — AI Writing Assistant for Ministry Voices';
    return () => { document.title = prev; };
  }, [title]);
}
