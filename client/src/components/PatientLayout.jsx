import { useAuth } from "../context/AuthContext.jsx";
import { usePatientAuth } from "../context/PatientAuthContext.jsx";
import BaseLayout from "./BaseLayout.jsx";

function PatientLayout() {
  const { patient: patientAuthPatient, logout: patientLogout } = usePatientAuth();
  const { user: unifiedUser, logout: unifiedLogout } = useAuth();
  const patient = patientAuthPatient || (unifiedUser?.role === "patient" ? unifiedUser : null);

  return (
    <BaseLayout
      role="patient"
      user={unifiedUser}
      patient={patient}
      isPatientPortal={true}
      authContext="usePatientAuth"
      logoutHandler={() => {
        patientLogout();
        unifiedLogout();
      }}
      navigateToLogin="/login"
      getUserName={() => patient?.name}
      getUserInitial={() => patient?.name?.charAt(0) || "P"}
      getRoleConfig={() => ({
        label: "Patient Portal",
        title: "Patient Health Portal",
        badge: "Patient Portal",
        badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
        avatarBg: "bg-slate-900 text-white shadow-xs",
        tagColor: "text-slate-500",
        roleDesc: "Patient Record",
      })}
    />
  );
}

export default PatientLayout;