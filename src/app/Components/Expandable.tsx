import { ChevronIcon, Collapse, Flex, Text, Touchable } from "@artsy/palette-mobile"
import { MAX_WIDTH } from "app/Components/Artist/Biography"
import { MotiView } from "moti"
import { useState } from "react"

interface ExpandableProps {
  label?: string
  expanded?: boolean
  children: React.ReactNode
}

/**
 * Expandable component used only by Artist About tab, if there's a need to use it elsewhere
 * move it to palette
 */
export const Expandable: React.FC<ExpandableProps> = ({
  children,
  expanded: propExpanded,
  label,
}) => {
  const [expanded, setExpanded] = useState(propExpanded)

  const handleToggle = () => {
    setExpanded((prev) => !prev)
  }

  return (
    <Flex borderTopWidth={1} py={1} accessibilityHint="Toggles the accordion" maxWidth={MAX_WIDTH}>
      <Touchable
        onPress={handleToggle}
        accessibilityRole="togglebutton"
        accessibilityLabel={label}
        accessibilityState={{ expanded }}
      >
        <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text variant="sm">{label}</Text>

          <MotiView
            animate={{ transform: [{ rotate: !!expanded ? "-90deg" : "90deg" }] }}
            style={{ transform: [{ rotate: !!expanded ? "-90deg" : "90deg" }] }}
            transition={{ type: "timing" }}
          >
            <ChevronIcon />
          </MotiView>
        </Flex>
      </Touchable>

      <Collapse opened={!!expanded}>{children}</Collapse>
    </Flex>
  )
}
