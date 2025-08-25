import { useEffect } from 'react'

type Props = { share: string; host?: string }

export default function HeyGenStreamingEmbed({ share, host = 'https://labs.heygen.com' }: Props) {
	useEffect(() => {
		const url = `${host}/guest/streaming-embed?share=${encodeURIComponent(share)}&inIFrame=1`
		const clientWidth = document.body.clientWidth

		const wrapDiv = document.createElement('div')
		wrapDiv.id = 'heygen-streaming-embed'

		const container = document.createElement('div')
		container.id = 'heygen-streaming-container'

		const stylesheet = document.createElement('style')
		stylesheet.innerHTML = `
#heygen-streaming-embed {
	z-index: 30;
	position: fixed;
	right: 24px;
	bottom: 24px;
	width: 160px;
	height: 160px;
	border-radius: 50%;
	border: 2px solid #fff;
	box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.12);
	transition: all linear 0.1s;
	overflow: hidden;
	opacity: 0;
	visibility: hidden;
}
#heygen-streaming-embed.show { opacity: 1; visibility: visible; }
#heygen-streaming-embed.expand {
	${clientWidth < 540 ? 'height: min(70vh, 360px); width: 96%; left: 2%; right: 2%;' : 'height: 366px; width: calc(366px * 16 / 9);'}
	border: 0; border-radius: 12px;
}
#heygen-streaming-container { width: 100%; height: 100%; }
#heygen-streaming-container iframe { width: 100%; height: 100%; border: 0; }
`

		const iframe = document.createElement('iframe')
		iframe.allowFullscreen = false
		iframe.title = 'Streaming Embed'
		iframe.role = 'dialog'
		iframe.allow = 'microphone'
		iframe.src = url

		let visible = false
		let initial = false

		const onMsg = (e: MessageEvent) => {
			if (e.origin === host && (e as any).data?.type === 'streaming-embed') {
				const action = (e as any).data.action
				if (action === 'init') {
					initial = true
					wrapDiv.classList.toggle('show', initial)
				} else if (action === 'show') {
					visible = true
					wrapDiv.classList.toggle('expand', visible)
				} else if (action === 'hide') {
					visible = false
					wrapDiv.classList.toggle('expand', visible)
				}
			}
		}

		window.addEventListener('message', onMsg)
		container.appendChild(iframe)
		wrapDiv.appendChild(stylesheet)
		wrapDiv.appendChild(container)
		document.body.appendChild(wrapDiv)

		return () => {
			window.removeEventListener('message', onMsg)
			try { document.body.removeChild(wrapDiv) } catch {}
		}
	}, [share, host])

	return null
}
