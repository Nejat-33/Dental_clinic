import { useEffect, useRef, useState } from 'react';
import { discardUpload } from '@/lib/upload';

export function useImageField(initial: string | null) {
  const [image, setImage] = useState<string | null>(initial);
  const current = useRef(image);
  const committed = useRef(false);

  // Form closed without saving: throw away an upload nobody will use
  useEffect(
    () => () => {
      if (!committed.current && current.current !== initial) discardUpload(current.current);
    },
    [initial],
  );

  function change(next: string | null) {
    if (current.current && current.current !== initial) discardUpload(current.current); // replaced unsaved upload
    current.current = next;
    setImage(next);
  }

  /** Call after a successful save */
  function commit() {
    committed.current = true;
    if (initial && initial !== current.current) discardUpload(initial); // old image no longer used
  }

  return { image, change, commit, changed: image !== initial };
}