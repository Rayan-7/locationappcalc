import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './screens/MainScreen';
const Stack = createNativeStackNavigator();
const StackNavigator = () => {
	return (
		<NavigationContainer>
			<Stack.Navigator>
				<Stack.Screen name="MainScreen" component={MainScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default StackNavigator;
