import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import { Text } from "universal";
import { styled, tw } from "universal/tailwind";

type ButtonProps = {
  children: React.ReactNode;
  isLoading?: boolean;
  textStyle?: StyleProp<ViewStyle>;
} & React.ComponentProps<typeof TouchableOpacity>;

const Button = styled(
  ({ children, isLoading, style, textStyle, ...props }: ButtonProps) => {
    return (
      <TouchableOpacity
        style={[tw`p-2 border border-gray-600 cursor-pointer`, style]}
        {...props}
      >
        {isLoading ? (
          <Text style={textStyle}>Loading...</Text>
        ) : (
          <Text style={textStyle}>{children}</Text>
        )}
      </TouchableOpacity>
    );
  }
);

export default Button;
