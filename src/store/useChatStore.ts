import { create } from 'zustand'

type Msg = { role: 'user' | 'bot'; text: string }

type AvatarData = { 
	videoUrl: string | null; 
	concept: string;
	difficulty?: string;
	subject?: string;
	interactiveElements?: string[];
}

type State = {
	messages: Msg[]
	loading: boolean
	avatar: AvatarData
	slides: string[]
	isAvatarSpeaking: boolean
	currentAnimationEvent: string | null
	addMessage: (m: Msg) => void
	setLoading: (v: boolean) => void
	setAvatar: (a: AvatarData) => void
	setSlides: (s: string[]) => void
	setAvatarSpeaking: (speaking: boolean) => void
	setAnimationEvent: (event: string | null) => void
	reset: () => void
}

export const useChatStore = create<State>((set) => ({
	messages: [],
	loading: false,
	avatar: { videoUrl: null, concept: '', difficulty: 'beginner', subject: 'General', interactiveElements: [] },
	slides: [],
	isAvatarSpeaking: false,
	currentAnimationEvent: null,
	addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
	setLoading: (v) => set({ loading: v }),
	setAvatar: (a) => set({ avatar: a }),
	setSlides: (slides) => set({ slides }),
	setAvatarSpeaking: (speaking) => set({ isAvatarSpeaking: speaking }),
	setAnimationEvent: (event) => set({ currentAnimationEvent: event }),
	reset: () => set({ 
		messages: [], 
		loading: false, 
		avatar: { videoUrl: null, concept: '', difficulty: 'beginner', subject: 'General', interactiveElements: [] }, 
		slides: [],
		isAvatarSpeaking: false,
		currentAnimationEvent: null
	}),
}))
