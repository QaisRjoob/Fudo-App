import { useLocalSearchParams } from 'expo-router';
import { ProfileScreen } from '../../src/views';

export default function UserProfile() {
  const { userId } = useLocalSearchParams();
  
  return <ProfileScreen route={{ params: { userId } }} />;
}
