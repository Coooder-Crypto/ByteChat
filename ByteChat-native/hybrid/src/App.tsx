import "./styles.css";
import { ChakraProvider, Container, extendTheme } from "@chakra-ui/react";
import { HomeView } from "./components/HomeView";
import { ChatView } from "./components/ChatView";
import { useChatConnection } from "./hooks/useChatConnection";
import { HeaderBar } from "./components/HeaderBar";

const theme = extendTheme({
  styles: {
    global: {
      "html, body, #root": {
        height: "100%",
        background: "#f5f7fb",
        color: "#0f172a",
      },
    },
  },
  colors: {
    brand: {
      500: "#2f7cf7",
    },
  },
});

export function App() {
  const {
    state: { userId, roomId, wsUrl, status, view, roomList, messages, loadingHistory, messagesRef, input },
    setUserId,
    setRoomId,
    setWsUrl,
    setInput,
    setView,
    joinRoom,
    sendMessage,
    handleDisconnect,
  } = useChatConnection();

  return (
    <ChakraProvider theme={theme}>
      <Container maxW="100vw" px={0} py={0} minH="100vh">
        <HeaderBar view={view} roomId={roomId} status={status} />
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
            messagesRef={messagesRef}
            isMe={(id) => id === userId}
            loadingHistory={loadingHistory}
          />
        )}
      </Container>
    </ChakraProvider>
  );
}
