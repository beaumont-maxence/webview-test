import { useState } from 'react';  
import { Button } from './ui/button';
import SnakeGame from './SnakeGame';

declare global {
  interface Window {
    Unity?: {
      call: (msg: string) => void;
    };
  }
}


function SamplePage() {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [lastEvent, setLastEvent] = useState<string>('No events yet');
    const [showVideo, setShowVideo] = useState(false);
    const [cookieMessage, setCookieMessage] = useState('No cookie set');
    const [showSnakeGame, setShowSnakeGame] = useState(false);

    const callUnity = async (eventType: string, data?: any) => {
        setIsLoading(eventType);
        setLastEvent(`Sending: ${eventType}`);

        try {
            const message = data ? JSON.stringify({ event: eventType, data }) : eventType;

            if (window.Unity && window.Unity.call) {
            window.Unity.call(message);
            setLastEvent(`Sent: ${eventType}`);
            } else {
            console.log('Unity not available, message:', message);
            setLastEvent('Unity not available - logged to console');
            }
        } catch (error) {
            console.error('Error sending to Unity:', error);
            setLastEvent('Error sending event');
        } finally {
            setTimeout(() => setIsLoading(null), 500);
        }
    };

    const setCookie = () => {
        document.cookie = "testCookie=HelloWorld; path=/; max-age=3600";
        setCookieMessage('Cookie set: testCookie=HelloWorld');
    };

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };

    const deleteCookie = (name: string) => {
        document.cookie = `${name}=; path=/; max-age=-1`;
        setCookieMessage(`Cookie deleted: ${name}`);
    };

    const handleGetCookie = () => {
        const value = getCookie('testCookie');
        setCookieMessage(value ? `Cookie value: ${value}` : 'Cookie not found');
    };

    const handleDeleteCookie = () => {
        deleteCookie('testCookie');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
                <h1 className="text-3xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">Unity WebView Test</h1>
                
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-xl font-semibold text-gray-800 mb-4">Unity Events</h2>
                    <div className="space-y-3">
                        <Button
                            onClick={() => callUnity('greeting', { message: 'Hello from React!', timestamp: Date.now() })}
                            disabled={isLoading === 'greeting'}
                        >
                            {isLoading === 'greeting' ? 'Loading...' : '📢 Send Greeting'}
                        </Button>

                        <Button
                            onClick={() => callUnity('action', { type: 'button_click', buttonId: 1, value: Math.random() })}
                            variant="default"
                            disabled={isLoading === 'action'}
                        >
                            {isLoading === 'action' ? 'Loading...' : '🎯 Action Event'}
                        </Button>

                        <Button
                            onClick={() => callUnity('data_update', { player: { level: 5, score: 1250 }, items: ['sword', 'shield'] })}
                            variant="default"
                            disabled={isLoading === 'data_update'}
                        >
                            {isLoading === 'data_update' ? 'Loading...' : '📊 Send Data'}
                        </Button>

                        <Button
                            onClick={() => callUnity('navigation', { target: 'main_menu', from: 'sample_panel' })}
                            disabled={isLoading === 'navigation'}
                        >
                            {isLoading === 'navigation' ? 'Loading...' : '🧭 Navigate'}
                        </Button>

                        <Button
                            onClick={() => callUnity('close_webview')}
                            variant="default"
                            disabled={isLoading === 'close_webview'}
                        >
                            {isLoading === 'close_webview' ? 'Loading...' : '❌ Close Panel'}
                        </Button>

                        <Button
                            onClick={() => callUnity('reload_scene', { scene: 'current', preserveState: true })}
                            variant="default"
                            disabled={isLoading === 'reload_scene'}
                        >
                            {isLoading === 'reload_scene' ? 'Loading...' : '🔄 Reload Scene'}
                        </Button>

                        <Button
                            onClick={() => setShowVideo(!showVideo)}
                            variant="default"
                        >
                            🎥 Toggle YouTube Video
                        </Button>

                        <Button
                            onClick={() => setShowSnakeGame(!showSnakeGame)}
                            variant="default"
                        >
                            🐍 Toggle Snake Game
                        </Button>
                    </div>
                </div>

                {showVideo && (
                    <div className="mb-6 sm:mb-8">
                        <h2 className="text-2xl sm:text-xl font-semibold text-gray-800 mb-4">Embedded YouTube Video</h2>
                        <div className="aspect-w-16 aspect-h-9">
                            <iframe
                                src="https://www.youtube.com/embed/F7pSikcoKIM"
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-64 sm:h-80 md:h-96 rounded-lg"
                            ></iframe>
                        </div>
                    </div>
                )}

                {showSnakeGame && <SnakeGame />}

                <div className="mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-xl font-semibold text-gray-800 mb-4">Cookie Test</h2>
                    <p className="text-gray-600 text-lg sm:text-base mb-4">{cookieMessage}</p>
                    <div className="space-y-3">
                        <Button onClick={setCookie} variant="default">
                            🍪 Set Cookie
                        </Button>
                        <Button onClick={handleGetCookie} variant="outline">
                            📖 Get Cookie
                        </Button>
                        <Button onClick={handleDeleteCookie} variant="destructive">
                            🗑️ Delete Cookie
                        </Button>
                    </div>
                </div>

                <div className="text-center text-gray-500 text-sm">
                    Last Event: {lastEvent}
                </div>
            </div>
        </div>
    );
};

export default SamplePage;