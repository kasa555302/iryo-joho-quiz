interface Props {
  easy: string | null
  full: string
}

// やさしい説明（あれば）＋ 通常の解説
export function ExplanationBlock({ easy, full }: Props) {
  return (
    <>
      {easy && (
        <div className="easy-note">
          <p className="easy-label">やさしく言うと</p>
          <p className="easy-body">{easy}</p>
        </div>
      )}
      <p className="explanation">{full}</p>
    </>
  )
}
