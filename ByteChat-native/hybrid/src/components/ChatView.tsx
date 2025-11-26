import { ChatProps } from "../core/types";
import { toneColor } from "../utils/theme";
import { MessageBubble } from "./MessageBubble";
import { Box, Button, Flex, Heading, Input, Text } from "@chakra-ui/react";

export function ChatView({
  roomId,
  status,
  messages,
  input,
  onBack,
  onChangeInput,
  onSend,
  messagesRef,
  isMe,
  loadingHistory,
}: ChatProps) {
  return (
    <Flex direction="column" minH="100vh" bg="white">
      <Box
        position="sticky"
        top="0"
        zIndex={10}
        bg="white"
        px={3}
        py={2}
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Flex align="center" justify="space-between" fontSize="sm" color="gray.600">
          <Flex align="center" gap={2}>
            <Heading size="sm">房间：{roomId}</Heading>
            <Flex align="center" gap={1}>
              <Box w="10px" h="10px" rounded="full" bg={toneColor(status.tone)} />
              <Text>{status.text}</Text>
            </Flex>
          </Flex>
          <Button variant="ghost" size="sm" onClick={onBack}>
            退出
          </Button>
        </Flex>
      </Box>

      <Box flex="1" minH="0" display="flex" flexDir="column" px={3} pt={2} gap={2}>
        <Text textAlign="center" fontSize="xs" color="gray.500">
          {loadingHistory ? "加载中..." : "上滑加载更多历史"}
        </Text>

        <Box
          ref={messagesRef}
          flex="1"
          minH="0"
          overflowY="auto"
          display="flex"
          flexDir="column"
          gap={2}
          pb={2}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isMe={isMe(msg.senderId)} />
          ))}
        </Box>
      </Box>

      <Box
        position="sticky"
        bottom="0"
        w="100%"
        bg="white"
        borderTop="1px solid"
        borderColor="gray.100"
      >
        <Flex gap={2} align="flex-end" p={3}>
          <Input
            as="textarea"
            value={input}
            onChange={(e) => onChangeInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="输入消息，Cmd/Ctrl + Enter 发送"
            rows={2}
            resize="vertical"
          />
          <Button colorScheme="blue" onClick={onSend}>
            发送
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}
