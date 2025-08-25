declare module 'react-video-chroma' {
	import * as React from 'react'
	type Props = { src: string; color?: [number, number, number]; tolerance?: number; className?: string }
	export default function VideoChroma(props: Props): React.ReactElement
}

