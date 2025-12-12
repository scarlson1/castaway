import { CheckRounded, ContentCopyRounded } from '@mui/icons-material';
import { Box, IconButton, styled, Tooltip } from '@mui/material';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { useState } from 'react';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

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

// const components: Components = {
//   // @ts-ignore
//   code({ node, inline, className, children, ...props }) {
//     if (inline)
//       return (
//         <code className={className} {...props}>
//           {children}
//         </code>
//       );
//     return <CodeBlock>{children}</CodeBlock>;
//   },
// };

function extractText(node: any): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node?.props?.children) return extractText(node.props.children);
  return '';
}

const markdownComponents = {
  code({ inline, className, children, ...props }: any) {
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

    return <ChatCodeBlock code={rawText} language={language} />;
  },
};

export function ChatMarkdown({ content }: { content: string }) {
  return (
    <ChatMarkdownStyledWrapper className='prose prose-neutral dark:prose-invert max-w-none'>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        // components={components}
        components={markdownComponents}
      >
        {content}
      </Markdown>
    </ChatMarkdownStyledWrapper>
  );
}

// function CodeBlock({ children }) {
//   const text = String(children).trim();

//   const copy = () => navigator.clipboard.writeText(text);

//   return (
//     <Box sx={{ position: 'relative' }}>
//       <IconButton
//         size='small'
//         onClick={copy}
//         sx={{ position: 'absolute', right: 4, top: 2 }}
//       >
//         <CopyAllRounded fontSize='inherit' />
//       </IconButton>
//       <pre>
//         <code>{text}</code>
//       </pre>
//     </Box>
//   );
// }

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
        overflow: 'hidden',
        // mt: 1,
        // mb: 1,
      }}
    >
      {/* Copy Button */}
      <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 10 }}>
        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <IconButton
            size='small'
            onClick={handleCopy}
            sx={{
              bgcolor: 'background.default',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {copied ? (
              <CheckRounded fontSize='small' />
            ) : (
              <ContentCopyRounded fontSize='small' />
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
