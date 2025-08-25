import Chat from './components/Chat'
import AvatarStage from './components/AvatarStage'
import HeyGenStreamingEmbed from './components/HeyGenStreamingEmbed'

export default function App() {
	return (
		<div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-gray-50">
			<Chat />
			<AvatarStage />
			<HeyGenStreamingEmbed share="eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJNYXJpYW5uZV9Qcm9mZXNzaW9uYWxMb29rX3B1YmxpYyIsInByZXZpZXdJbWciOiJodHRwczovL2ZpbGVzMi5oZXlnZW4uYWkvYXZhdGFyL3YzL2UzMmQ3ZDEwNDdhMjRjMzRhNzBjNTRjMmI3NzQ0MWMwXzU1ODkwL3ByZXZpZXdfdGFyZ2V0LndlYnAiLCJuZWVkUmVtb3ZlQmFja2dyb3VuZCI6dHJ1ZSwia25vd2xlZGdlQmFzZUlkIjoiMWFjZWZiMzZmZWE4NDY1YzhjY2IxNWNkNWU4NDE1OWMiLCJ1c2VybmFtZSI6IjNmNTdmNzUzNGUzNzRmNWFhNzNjYzAzYjM2MzVlMmE0In0=" />
		</div>
	)
}
