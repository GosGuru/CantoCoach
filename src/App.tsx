import { CoachExperience } from "./components/CoachExperience";
import { SafetyGate } from "./components/SafetyGate";

export default function App() {
	return (
		<CoachExperience>
			<SafetyGate />
		</CoachExperience>
	);
}
