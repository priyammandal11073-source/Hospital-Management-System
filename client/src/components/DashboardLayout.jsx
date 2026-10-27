import { useAuth } from "../context/AuthContext.jsx";
import BaseLayout from "./BaseLayout.jsx";

function DashboardLayout() {
  const { user, logout } = useAuth();
  const role = user?.role || "admin";

  return (
    <BaseLayout
      role={role}
      user={user}
      isPatientPortal={false}
      authContext="useAuth"
      logoutHandler={logout}
      navigateToLogin="/login"
      getUserName={() => user?.name}
      getUserInitial={() => user?.name?.charAt(0) || "U"}
      getRoleConfig={(role, user) => {
        const PORTAL_CONFIG = {
          admin: {
            label: "Admin Portal",
            title: "Hospital Administration",
            badge: "Hospital Administration",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "System Administrator",
          },
          doctor: {
            label: "Doctor Portal",
            title: "Physician Clinical Workspace",
            badge: "Clinical Workspace",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Consultant Physician",
          },
          receptionist: {
            label: "Front Desk Portal",
            title: "Front Desk & Admissions",
            badge: "Admissions Desk",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Admissions & Cashier",
          },
          nurse: {
            label: "Nursing Station",
            title: "Inpatient Nursing Station",
            badge: "Nursing Station",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Clinical Care Nurse",
          },
          patient: {
            label: "Patient Portal",
            title: "Patient Health Portal",
            badge: "Patient Portal",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Patient Record",
          },
          pharmacist: {
            label: "Pharmacy Portal",
            title: "Hospital Pharmacy Operations",
            badge: "Pharmacy Operations",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Chief Pharmacist",
          },
          diagnostic_admin: {
            label: "Diagnostic Services",
            title: "Diagnostic & Imaging Services",
            badge: "Diagnostic Center",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Diagnostic Administrator",
          },
          pathologist: {
            label: "Pathology Desk",
            title: "Pathology & Laboratory Medicine",
            badge: "Pathology Department",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Consultant Pathologist",
          },
          radiologist: {
            label: "Radiology Desk",
            title: "Medical Imaging & Radiology",
            badge: "Radiology Department",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Consultant Radiologist",
          },
          lab_technician: {
            label: "Laboratory Bench",
            title: "Phlebotomy & Clinical Laboratory",
            badge: "Clinical Laboratory",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Laboratory Technologist",
          },
          radiology_technician: {
            label: "Radiology Station",
            title: "Imaging Modality Station",
            badge: "Imaging Station",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Radiology Technologist",
          },
          emergency: {
            label: "Emergency Portal",
            title: "Emergency & Trauma Center",
            badge: "Emergency Department",
            badgeClass: "liquid-glass-pill text-slate-800 font-medium px-2.5 py-0.5 text-xs",
            avatarBg: "bg-slate-900 text-white shadow-xs",
            tagColor: "text-slate-500",
            roleDesc: "Emergency Physician / Triage",
          },
        };
        return PORTAL_CONFIG[role] || PORTAL_CONFIG.admin;
      }}
    />
  );
}

export default DashboardLayout;