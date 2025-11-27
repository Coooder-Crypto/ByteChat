import "./index.css";
import { HomeView } from "./components/HomeView";
import { ChatView } from "./components/ChatView";
import { useChatConnection } from "./hooks/useChatConnection";
import { HeaderBar } from "./components/HeaderBar";

export function App() {
  const {
    state: {
      userId,
      roomId,
      wsUrl,
      status,
      view,
      roomList,
      messages,
      loadingHistory,
      messagesRef,
      input,
    },
    setUserId,
    setRoomId,
    setWsUrl,
    setInput,
    setView,
    joinRoom,
    sendMessage,
    uploadAndSend,
    handleDisconnect,
  } = useChatConnection();

  return (
    <div className="min-h-screen w-full">
      <HeaderBar
        view={view}
        roomId={roomId}
        status={status}
        onBack={() => {
          handleDisconnect();
          setView("home");
        }}
      />
      {view === "home" ? (
        <HomeView
          userId={userId}
          wsUrl={wsUrl}
          roomId={roomId}
          roomList={roomList}
          onChangeUser={setUserId}
          onChangeWs={setWsUrl}
          onChangeRoom={setRoomId}
          onJoin={joinRoom}
        />
      ) : (
        <ChatView
          roomId={roomId}
          status={status}
          messages={messages}
          input={input}
          onBack={() => {
            handleDisconnect();
            setView("home");
          }}
          onChangeInput={setInput}
          onSend={sendMessage}
          onSendMedia={uploadAndSend}
          messagesRef={messagesRef}
          isMe={(id) => id === userId}
          loadingHistory={loadingHistory}
        />
      )}
    </div>
  );
}
