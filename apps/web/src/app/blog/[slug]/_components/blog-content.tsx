interface Props {
  content: string
}

export function BlogContent({ content }: Props) {
  return (
    <div
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
