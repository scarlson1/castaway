import { CheckRounded, ContentCopyRounded } from '@mui/icons-material';
import { Box, IconButton, styled, Tooltip } from '@mui/material';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { useState } from 'react';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

// copy button (move up to messagelist & use context )
// https://chatgpt.com/s/t_694014aa0a6c8191bca0060fa055cd1f

const ChatMarkdownStyledWrapper = styled(Box)(({ theme }) => ({
  '& p': {
    color: theme.vars.palette.text.primary, // 'text.primary',
    lineHeight: 1.7,
    margin: '0.5em 0',
  },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    color: theme.vars.palette.text.primary,
    fontWeight: 600,
    marginTop: '1.4em',
    marginBottom: '0.6em',
  },
  '& a': {
    color: theme.vars.palette.primary.main,
    textDecoration: 'underline',
  },
  '& ul, & ol': {
    paddingLeft: '1.5em',
    margin: '0.8em 0',
  },
  '& pre': {
    overflowX: 'auto',
    whiteSpace: 'pre-wrap' /* wraps long lines */,
    wordBreak: 'break-word',
    backgroundColor: theme.vars.palette.background.paper, //  'background.paper',
    // padding: theme.spacing(2), // 2,
    borderRadius: theme.spacing(2), // 2,
    fontSize: '0.875rem',
  },
  '& code': {
    whiteSpace: 'pre-wrap',
    backgroundColor: theme.vars.palette.action.hover, // 'action.hover',
    borderRadius: '4px',
    // padding: '2px 4px',
    fontSize: '0.875em',
  },
}));

function extractText(node: any): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node?.props?.children) return extractText(node.props.children);
  return '';
}

// const markdownComponents = {
//   code({ inline, className, children, ...props }: any) {
//     const isInline =
//       !(className && className.includes('language-')) &&
//       typeof children === 'string'; // /^language-/.test(className)
//     // props.node?.tagName === 'code' && props.parent?.tagName !== 'pre';

//     const rawText = extractText(children);
//     let test = props.node?.properties?.className?.find((c) =>
//       c.includes('language-')
//     );
//     const language = test?.replace('language-', '') || undefined;

//     // if (inline) {
//     if (isInline) {
//       return (
//         <code
//           style={{
//             background: 'rgba(0,0,0,0.08)',
//             padding: '2px 4px',
//             borderRadius: '4px',
//             fontFamily: 'monospace',
//           }}
//           className={className}
//           // inline={true}
//           {...props}
//         >
//           {rawText}
//         </code>
//       );
//     }

//     return (
//       <ChatCodeBlock
//         code={rawText}
//         language={language}
//         // scrollContainerRef={props.scrollContainerRef}
//       />
//     );
//   },
// };

function CodeComponent({ inline, className, children, ...props }: any) {
  const isInline =
    !(className && className.includes('language-')) &&
    typeof children === 'string'; // /^language-/.test(className)
  // props.node?.tagName === 'code' && props.parent?.tagName !== 'pre';

  const rawText = extractText(children);
  let test = props.node?.properties?.className?.find((c) =>
    c.includes('language-')
  );
  const language = test?.replace('language-', '') || undefined;

  // if (inline) {
  if (isInline) {
    return (
      <code
        style={{
          background: 'rgba(0,0,0,0.08)',
          padding: '2px 4px',
          borderRadius: '4px',
          fontFamily: 'monospace',
        }}
        className={className}
        // inline={true}
        {...props}
      >
        {rawText}
      </code>
    );
  }
  return (
    <ChatCodeBlock
      code={rawText}
      language={language}
      // scrollContainerRef={props.scrollContainerRef}
    />
  );
}

export function ChatMarkdown({
  content,
}: // scrollContainerRef,
{
  content: string;
  // scrollContainerRef: RefObject<HTMLDivElement>;
}) {
  return (
    <ChatMarkdownStyledWrapper className='prose prose-neutral dark:prose-invert max-w-none'>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        // components={markdownComponents}
        components={{
          code: (props) => <CodeComponent {...props} />,
        }}
      >
        {content}
      </Markdown>
    </ChatMarkdownStyledWrapper>
  );
}

interface ChatCodeBlockProps {
  code: string;
  language?: string;
}

function ChatCodeBlock({ code, language }: ChatCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const highlighted = language
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        // overflow: 'hidden',
      }}
    >
      {/* Copy Button */}
      <Box
        sx={{
          // position: 'sticky', need to use intersection observer & move to MessageList
          position: 'absolute',
          top: 6,
          right: 6,
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 2,
        }}
      >
        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <IconButton size='small' onClick={handleCopy}>
            {copied ? (
              <CheckRounded fontSize='inherit' />
            ) : (
              <ContentCopyRounded fontSize='inherit' />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Code Container */}
      <Box
        component='pre'
        sx={{
          m: 0,
          p: 2,
          overflowX: 'auto',
          whiteSpace: 'pre',
          fontSize: '0.9rem',
          lineHeight: 1.6,
        }}
      >
        <code
          dangerouslySetInnerHTML={{ __html: highlighted }}
          style={{ fontFamily: 'monospace' }}
        />
      </Box>
    </Box>
  );
}

// attempt 2: use intersection to control visibility

// function useIntersection(ref: React.RefObject<Element>) {
//   const [visible, setVisible] = useState(false);

//   useEffect(() => {
//     if (!ref.current) return;

//     const observer = new IntersectionObserver(
//       ([entry]) => setVisible(entry.isIntersecting),
//       {
//         root: null, // viewport
//         threshold: 0.1,
//       }
//     );

//     observer.observe(ref.current);
//     return () => observer.disconnect();
//   }, []);

//   return visible;
// }

// function ChatCodeBlock({ code, language }: ChatCodeBlockProps) {
//   const ref = useRef<HTMLDivElement>(null);
//   const visible = useIntersection(ref as RefObject<HTMLDivElement>);
//   const [copied, setCopied] = useState(false);

//   const highlighted = language
//     ? hljs.highlight(code, { language }).value
//     : hljs.highlightAuto(code).value;

//   const handleCopy = async () => {
//     await navigator.clipboard.writeText(code);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 1500);
//   };

//   return (
//     <>
//       {/* Fixed viewport button */}
//       {visible && (
//         <Box
//           sx={{
//             position: 'fixed',
//             top: 72, // below app bar
//             right: 24,
//             zIndex: 1500,
//           }}
//         >
//           <Tooltip title={copied ? 'Copied!' : 'Copy'}>
//             <IconButton
//               size='small'
//               onClick={handleCopy}
//               sx={{
//                 bgcolor: 'background.paper',
//                 boxShadow: 2,
//                 '&:hover': { bgcolor: 'action.hover' },
//               }}
//             >
//               {copied ? (
//                 <CheckRounded fontSize='small' />
//               ) : (
//                 <ContentCopyRounded fontSize='small' />
//               )}
//             </IconButton>
//           </Tooltip>
//         </Box>
//       )}

//       {/* Code block */}
//       <Box
//         ref={ref}
//         sx={{
//           borderRadius: 2,
//           border: '1px solid',
//           borderColor: 'divider',
//           bgcolor: 'background.paper',
//         }}
//       >
//         <Box
//           component='pre'
//           sx={{
//             m: 0,
//             p: 2,
//             overflowX: 'auto',
//             whiteSpace: 'pre',
//             fontSize: '0.9rem',
//             lineHeight: 1.6,
//           }}
//         >
//           <code
//             dangerouslySetInnerHTML={{ __html: highlighted }}
//             style={{ fontFamily: 'monospace' }}
//           />
//         </Box>
//       </Box>
//     </>
//   );
// }

// attempt 3: calc rectangle using scroll container ref

// function ChatCodeBlock({
//   code,
//   language,
//   scrollContainerRef,
// }: ChatCodeBlockProps & {
//   scrollContainerRef: React.RefObject<HTMLDivElement>;
// }) {
//   const blockRef = useRef<HTMLDivElement>(null);
//   const [top, setTop] = useState<number | null>(null);

//   const highlighted = language
//     ? hljs.highlight(code, { language }).value
//     : hljs.highlightAuto(code).value;

//   useEffect(() => {
//     const scrollEl = scrollContainerRef?.current;
//     if (!scrollEl || !blockRef.current) return;

//     const update = () => {
//       if (!blockRef.current) return;
//       const blockRect = blockRef.current.getBoundingClientRect();
//       const containerRect = scrollEl.getBoundingClientRect();

//       // top of button = max(block top, container top)
//       const nextTop = Math.max(blockRect.top, containerRect.top + 8);

//       // hide if completely out of view
//       if (
//         blockRect.bottom < containerRect.top ||
//         blockRect.top > containerRect.bottom
//       ) {
//         setTop(null);
//       } else {
//         setTop(nextTop);
//       }
//     };

//     update();
//     scrollEl.addEventListener('scroll', update, { passive: true });
//     window.addEventListener('resize', update);

//     return () => {
//       scrollEl.removeEventListener('scroll', update);
//       window.removeEventListener('resize', update);
//     };
//   }, []);

//   return (
//     <Box ref={blockRef} sx={{ position: 'relative' }}>
//       {top !== null && (
//         <Box
//           sx={{
//             position: 'fixed',
//             top,
//             right: 24,
//             zIndex: 1500,
//           }}
//         >
//           <Tooltip title='Copy'>
//             <IconButton size='small'>
//               <ContentCopyRounded fontSize='small' />
//             </IconButton>
//           </Tooltip>
//         </Box>
//       )}

//       <Box
//         component='pre'
//         sx={{
//           m: 0,
//           p: 2,
//           overflowX: 'auto',
//           whiteSpace: 'pre',
//           fontSize: '0.9rem',
//         }}
//       >
//         <code dangerouslySetInnerHTML={{ __html: highlighted }} />
//       </Box>
//     </Box>
//   );
// }
