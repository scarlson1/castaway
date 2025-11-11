import { useCallback, useState, type RefObject } from 'react';
import { useEventListener } from '~/hooks/useEventListener';

export function useHover<T extends HTMLElement = HTMLElement>(
  elementRef: RefObject<T>
) {
  const [hovering, setHovering] = useState(false);
  // const previousNode = useRef<T>(null);

  const handleMouseEnter = useCallback(() => {
    setHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovering(false);
  }, []);

  useEventListener('mouseenter', handleMouseEnter, elementRef);
  useEventListener('mouseleave', handleMouseLeave, elementRef);

  // const customRef = useCallback(
  //   (node) => {
  //     if (previousNode.current?.nodeType === Node.ELEMENT_NODE) {
  //       previousNode.current.removeEventListener(
  //         'mouseenter',
  //         handleMouseEnter
  //       );
  //       previousNode.current.removeEventListener(
  //         'mouseleave',
  //         handleMouseLeave
  //       );
  //     }

  //     if (node?.nodeType === Node.ELEMENT_NODE) {
  //       node.addEventListener('mouseenter', handleMouseEnter);
  //       node.addEventListener('mouseleave', handleMouseLeave);
  //     }

  //     previousNode.current = node;
  //   },
  //   [handleMouseEnter, handleMouseLeave]
  // );

  // return [customRef, hovering] as const;
  return [hovering];
}

// alternatively: separate out the ref & pass as prop:

// import { useState } from 'react'

// import type { RefObject } from 'react'

// import { useEventListener } from 'usehooks-ts'

// export function useHover<T extends HTMLElement = HTMLElement>(
//   elementRef: RefObject<T>,
// ): boolean {
//   const [value, setValue] = useState<boolean>(false)

//   const handleMouseEnter = () => {
//     setValue(true)
//   }
//   const handleMouseLeave = () => {
//     setValue(false)
//   }

//   useEventListener('mouseenter', handleMouseEnter, elementRef)
//   useEventListener('mouseleave', handleMouseLeave, elementRef)

//   return value
// }
