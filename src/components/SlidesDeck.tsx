import { Deck, Slide, Heading, DefaultTemplate, UnorderedList, ListItem } from 'spectacle'

export default function SlidesDeck({ title, bullets }: { title: string; bullets: string[] }) {
  if (!bullets || bullets.length === 0) return null
  
  const theme = {
    size: {
      width: 1024,
      height: 768
    },
    colors: {
      primary: '#333',
      secondary: '#666'
    }
  }
  
  return (
    <div className="hidden lg:block absolute inset-y-4 left-4 right-4 z-20 pointer-events-none">
      <div className="pointer-events-auto rounded-2xl overflow-hidden shadow-2xl border border-black/10 bg-white max-h-96">
        <div style={{ width: '100%', height: '350px' }}>
          <Deck template={<DefaultTemplate />} theme={theme}>
            <Slide>
              <Heading fontSize="h4">{title || 'Overview'}</Heading>
              <UnorderedList>
                {bullets.slice(0, 6).map((b, i) => (
                  <ListItem key={i} fontSize="text">{b}</ListItem>
                ))}
              </UnorderedList>
            </Slide>
          </Deck>
        </div>
      </div>
    </div>
  )
}

