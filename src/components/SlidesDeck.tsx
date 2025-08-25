import { Deck, Slide, Heading, DefaultTemplate, UnorderedList, ListItem } from 'spectacle'

export default function SlidesDeck({ title, bullets }: { title: string; bullets: string[] }) {
  if (!bullets || bullets.length === 0) return null
  return (
    <div className="hidden lg:block absolute inset-y-4 left-4 right-4 z-20 pointer-events-none">
      <div className="pointer-events-auto rounded-2xl overflow-hidden shadow-2xl border border-black/10 bg-white">
        <Deck template={<DefaultTemplate />}>
          <Slide>
            <Heading>{title || 'Overview'}</Heading>
            <UnorderedList>
              {bullets.slice(0, 6).map((b, i) => (
                <ListItem key={i}>{b}</ListItem>
              ))}
            </UnorderedList>
          </Slide>
        </Deck>
      </div>
    </div>
  )
}

