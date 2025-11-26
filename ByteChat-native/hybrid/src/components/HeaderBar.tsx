import { Box, Flex, Heading, Text, Button } from "@chakra-ui/react";
import { toneColor } from "../utils/theme";

type HeaderBarProps = {
  view: "home" | "chat";
  roomId?: string;
  status?: { text: string; tone: "ok" | "warn" | "fail" | "muted" };
};

export function HeaderBar({ view, roomId, status }: HeaderBarProps) {
  const isChat = view === "chat";
  return (
    <Box
      position="sticky"
      top={0}
      zIndex={20}
      w="100%"
      h={18}
      bg="white"
      px={4}
      py={4}
      borderBottom="1px solid"
      borderColor="gray.200"
      boxShadow="sm"
    >
      <Flex align="center" justify="space-between" gap={3}>
        <Flex align="center" gap={2}>
          {isChat && (
            <Button size="sm" variant="outline" onClick={() => window.history.back()}>
              返回
            </Button>
          )}
          <Heading size="md">{isChat ? `房间：${roomId || ""}` : "ByteChat"}</Heading>
        </Flex>
        {isChat && status && (
          <Flex align="center" gap={2} fontSize="sm" color="gray.600">
            <Box w="12px" h="12px" rounded="full" bg={toneColor(status.tone)} />
            <Text>{status.text}</Text>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
