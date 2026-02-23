import type { Language } from './types';

type TranslationKey =
    | 'dashboard' | 'reportBug' | 'analytics' | 'aiEngine' | 'adminPanel'
    | 'signIn' | 'signUp' | 'signOut' | 'forgotPassword' | 'email' | 'password'
    | 'fullName' | 'role' | 'submit' | 'cancel' | 'save' | 'delete' | 'edit'
    | 'search' | 'filter' | 'allProjects' | 'allSeverities' | 'notifications'
    | 'markAllRead' | 'noNotifications' | 'title' | 'description' | 'severity'
    | 'status' | 'assignee' | 'tags' | 'comments' | 'attachments' | 'stepsToReproduce'
    | 'expectedBehavior' | 'actualBehavior' | 'project' | 'bugDetails' | 'newBug'
    | 'totalBugs' | 'open' | 'inProgress' | 'resolved' | 'closed' | 'critical'
    | 'high' | 'medium' | 'low' | 'new' | 'guestAccess' | 'continueAsGuest'
    | 'help' | 'settings' | 'language' | 'team' | 'users' | 'projects'
    | 'aiAnalysis' | 'duplicateDetection' | 'severityPrediction' | 'retrainModel'
    | 'modelMetrics' | 'accuracy' | 'precision' | 'recall' | 'f1Score'
    | 'createAccount' | 'dontHaveAccount' | 'alreadyHaveAccount' | 'demoAccounts'
    | 'welcome' | 'quickActions' | 'recentActivity' | 'noBugsFound' | 'clearFilters'
    | 'applyFilters' | 'filterByStatus' | 'filterBySeverity' | 'filterByProject'
    | 'filterByAssignee' | 'filterByDate' | 'from' | 'to' | 'allAssignees' | 'allTags'
    | 'bugCreated' | 'bugUpdated' | 'statusChanged' | 'assignedTo' | 'unassigned'
    | 'addComment' | 'commentAdded' | 'noComments' | 'writeComment' | 'send'
    | 'backToDashboard' | 'viewBug' | 'editBug' | 'deleteBug' | 'confirmDelete'
    | 'bugDeleted' | 'noResults' | 'searchResults' | 'loading' | 'error'
    | 'success' | 'warning' | 'info' | 'confirm' | 'yes' | 'no'
    | 'createProject' | 'editProject' | 'deleteProject' | 'projectName' | 'projectDesc'
    | 'members' | 'createdAt' | 'actions' | 'manageUsers' | 'manageProjects'
    | 'userName' | 'verified' | 'pending' | 'yesVerified' | 'noPending'
    | 'joinDate' | 'changeRole' | 'admin' | 'developer' | 'tester'
    | 'noProjects' | 'noUsers' | 'selectRole' | 'enterEmail' | 'enterPassword'
    | 'enterName' | 'minLength' | 'passwordTooShort' | 'emailRequired'
    | 'nameRequired' | 'titleRequired' | 'descriptionRequired' | 'projectRequired'
    | 'reportSubmitted' | 'viewAllBugs' | 'viewAnalytics' | 'goToDashboard'
    | 'viewAIEngine' | 'adminSettings' | 'logout' | 'myProfile' | 'accountSettings'
    | 'darkMode' | 'lightMode' | 'appearance' | 'preferences' | 'general' | 'security' | 'privacy'
    | 'recentBugs' | 'myAssignedBugs' | 'reportedByMe' | 'allBugs' | 'openBugs'
    | 'inProgressBugs' | 'resolvedBugs' | 'closedBugs' | 'criticalBugs' | 'highPriorityBugs'
    | 'lowPriorityBugs' | 'mediumPriorityBugs' | 'bugCount' | 'assignedCount' | 'resolvedCount'
    | 'avgResolutionTime' | 'totalUsers' | 'activeProjects' | 'systemHealth' | 'healthy' | 'needsAttention'
    | 'noActivity' | 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'older' | 'justNow' | 'minutesAgo' | 'hoursAgo' | 'daysAgo';

const translations: Record<Language, Record<TranslationKey, string>> = {
    en: {
        dashboard: 'Dashboard', reportBug: 'Report Bug', analytics: 'Analytics',
        aiEngine: 'AI Engine', adminPanel: 'Admin Panel', signIn: 'Sign In',
        signUp: 'Sign Up', signOut: 'Sign Out', forgotPassword: 'Forgot Password?',
        email: 'Email', password: 'Password', fullName: 'Full Name', role: 'Role',
        submit: 'Submit', cancel: 'Cancel', save: 'Save', delete: 'Delete', edit: 'Edit',
        search: 'Search bugs...', filter: 'Filter', allProjects: 'All Projects',
        allSeverities: 'All Severities', notifications: 'Notifications',
        markAllRead: 'Mark all read', noNotifications: 'No notifications',
        title: 'Title', description: 'Description', severity: 'Severity',
        status: 'Status', assignee: 'Assign To', tags: 'Tags', comments: 'Comments',
        attachments: 'Attachments', stepsToReproduce: 'Steps to Reproduce',
        expectedBehavior: 'Expected Behavior', actualBehavior: 'Actual Behavior',
        project: 'Project', bugDetails: 'Bug Details', newBug: 'New Bug',
        totalBugs: 'Total Bugs', open: 'Open', inProgress: 'In Progress',
        resolved: 'Resolved', closed: 'Closed', critical: 'Critical',
        high: 'High', medium: 'Medium', low: 'Low', new: 'New',
        guestAccess: 'Guest Access', continueAsGuest: 'Continue as Guest',
        help: 'Help', settings: 'Settings', language: 'Language',
        team: 'Team Overview', users: 'Users', projects: 'Projects',
        aiAnalysis: 'AI Analysis Engine', duplicateDetection: 'Duplicate Detection',
        severityPrediction: 'Severity Prediction', retrainModel: 'Retrain Model',
        modelMetrics: 'Model Metrics', accuracy: 'Accuracy', precision: 'Precision',
        recall: 'Recall', f1Score: 'F1 Score', createAccount: 'Create Account',
        dontHaveAccount: "Don't have an account?", alreadyHaveAccount: 'Already have an account?',
        demoAccounts: 'Demo Accounts',
        // New translations
        welcome: 'Welcome', quickActions: 'Quick Actions', recentActivity: 'Recent Activity',
        noBugsFound: 'No bugs found', clearFilters: 'Clear Filters', applyFilters: 'Apply Filters',
        filterByStatus: 'Filter by Status', filterBySeverity: 'Filter by Severity',
        filterByProject: 'Filter by Project', filterByAssignee: 'Filter by Assignee',
        filterByDate: 'Filter by Date', from: 'From', to: 'To', allAssignees: 'All Assignees',
        allTags: 'All Tags', bugCreated: 'Bug Created', bugUpdated: 'Bug Updated',
        statusChanged: 'Status Changed', assignedTo: 'Assigned To', unassigned: 'Unassigned',
        addComment: 'Add Comment', commentAdded: 'Comment Added', noComments: 'No comments yet',
        writeComment: 'Write a comment...', send: 'Send', backToDashboard: 'Back to Dashboard',
        viewBug: 'View Bug', editBug: 'Edit Bug', deleteBug: 'Delete Bug', confirmDelete: 'Confirm Delete',
        bugDeleted: 'Bug Deleted', noResults: 'No results found', searchResults: 'Search Results',
        loading: 'Loading...', error: 'An error occurred', success: 'Success',
        warning: 'Warning', info: 'Information', confirm: 'Confirm', yes: 'Yes', no: 'No',
        createProject: 'Create Project', editProject: 'Edit Project', deleteProject: 'Delete Project',
        projectName: 'Project Name', projectDesc: 'Project Description', members: 'Members',
        createdAt: 'Created At', actions: 'Actions', manageUsers: 'Manage Users',
        manageProjects: 'Manage Projects', userName: 'User Name', verified: 'Verified',
        pending: 'Pending', yesVerified: 'Verified', noPending: 'Pending',
        joinDate: 'Join Date', changeRole: 'Change Role', admin: 'Admin',
        developer: 'Developer', tester: 'Tester',
        noProjects: 'No projects yet', noUsers: 'No users found', selectRole: 'Select Role',
        enterEmail: 'Enter email', enterPassword: 'Enter password', enterName: 'Enter name',
        minLength: 'Minimum length', passwordTooShort: 'Password must be at least 6 characters',
        emailRequired: 'Email is required', nameRequired: 'Name is required',
        titleRequired: 'Title is required', descriptionRequired: 'Description is required',
        projectRequired: 'Project is required', reportSubmitted: 'Bug report submitted successfully',
        viewAllBugs: 'View All Bugs', viewAnalytics: 'View Analytics', goToDashboard: 'Go to Dashboard',
        viewAIEngine: 'View AI Engine', adminSettings: 'Admin Settings', logout: 'Logout',
        myProfile: 'My Profile', accountSettings: 'Account Settings', darkMode: 'Dark Mode',
        lightMode: 'Light Mode', appearance: 'Appearance', preferences: 'Preferences',
        general: 'General', security: 'Security', privacy: 'Privacy',
        recentBugs: 'Recent Bugs', myAssignedBugs: 'My Assigned Bugs', reportedByMe: 'Reported By Me',
        allBugs: 'All Bugs', openBugs: 'Open Bugs', inProgressBugs: 'In Progress Bugs',
        resolvedBugs: 'Resolved Bugs', closedBugs: 'Closed Bugs', criticalBugs: 'Critical Bugs',
        highPriorityBugs: 'High Priority Bugs', lowPriorityBugs: 'Low Priority Bugs',
        mediumPriorityBugs: 'Medium Priority Bugs', bugCount: 'Bug Count', assignedCount: 'Assigned Count',
        resolvedCount: 'Resolved Count', avgResolutionTime: 'Avg Resolution Time',
        totalUsers: 'Total Users', activeProjects: 'Active Projects', systemHealth: 'System Health',
        healthy: 'Healthy', needsAttention: 'Needs Attention', noActivity: 'No recent activity',
        today: 'Today', yesterday: 'Yesterday', thisWeek: 'This Week', thisMonth: 'This Month',
        older: 'Older', justNow: 'Just now', minutesAgo: 'minutes ago', hoursAgo: 'hours ago',
        daysAgo: 'days ago',
    },
    hi: {
        dashboard: 'डैशबोर्ड', reportBug: 'बग रिपोर्ट', analytics: 'विश्लेषण',
        aiEngine: 'एआई इंजन', adminPanel: 'एडमिन पैनल', signIn: 'साइन इन',
        signUp: 'साइन अप', signOut: 'साइन आउट', forgotPassword: 'पासवर्ड भूल गए?',
        email: 'ईमेल', password: 'पासवर्ड', fullName: 'पूरा नाम', role: 'भूमिका',
        submit: 'जमा करें', cancel: 'रद्द करें', save: 'सेव करें', delete: 'हटाएं', edit: 'संपादित करें',
        search: 'बग खोजें...', filter: 'फ़िल्टर', allProjects: 'सभी प्रोजेक्ट',
        allSeverities: 'सभी गंभीरता', notifications: 'सूचनाएं',
        markAllRead: 'सभी पढ़ी हुई', noNotifications: 'कोई सूचना नहीं',
        title: 'शीर्षक', description: 'विवरण', severity: 'गंभीरता',
        status: 'स्थिति', assignee: 'असाइन करें', tags: 'टैग', comments: 'टिप्पणियां',
        attachments: 'अनुलग्नक', stepsToReproduce: 'पुनः उत्पन्न करने के चरण',
        expectedBehavior: 'अपेक्षित व्यवहार', actualBehavior: 'वास्तविक व्यवहार',
        project: 'प्रोजेक्ट', bugDetails: 'बग विवरण', newBug: 'नई बग',
        totalBugs: 'कुल बग', open: 'खुला', inProgress: 'प्रगति में',
        resolved: 'हल किया', closed: 'बंद', critical: 'गंभीर',
        high: 'उच्च', medium: 'मध्यम', low: 'कम', new: 'नया',
        guestAccess: 'अतिथि प्रवेश', continueAsGuest: 'अतिथि के रूप में जारी रखें',
        help: 'सहायता', settings: 'सेटिंग्स', language: 'भाषा',
        team: 'टीम अवलोकन', users: 'उपयोगकर्ता', projects: 'प्रोजेक्ट',
        aiAnalysis: 'एआई विश्लेषण इंजन', duplicateDetection: 'डुप्लिकेट पहचान',
        severityPrediction: 'गंभीरता पूर्वानुमान', retrainModel: 'मॉडल पुनः प्रशिक्षित करें',
        modelMetrics: 'मॉडल मेट्रिक्स', accuracy: 'सटीकता', precision: 'प्रिसिज़न',
        recall: 'रिकॉल', f1Score: 'F1 स्कोर', createAccount: 'खाता बनाएं',
        dontHaveAccount: 'खाता नहीं है?', alreadyHaveAccount: 'पहले से खाता है?',
        demoAccounts: 'डेमो खाते',
        // New translations
        welcome: 'स्वागत है', quickActions: 'त्वरित कार्य', recentActivity: 'हाल की गतिविधि',
        noBugsFound: 'कोई बग नहीं मिला', clearFilters: 'फ़िल्टर साफ़ करें', applyFilters: 'फ़िल्टर लागू करें',
        filterByStatus: 'स्थिति से फ़िल्टर करें', filterBySeverity: 'गंभीरता से फ़िल्टर करें',
        filterByProject: 'प्रोजेक्ट से फ़िल्टर करें', filterByAssignee: 'असाइनी से फ़िल्टर करें',
        filterByDate: 'तारीख से फ़िल्टर करें', from: 'से', to: 'तक', allAssignees: 'सभी असाइनी',
        allTags: 'सभी टैग', bugCreated: 'बग बनाया गया', bugUpdated: 'बग अपडेट किया गया',
        statusChanged: 'स्थिति बदली गई', assignedTo: 'को असाइन किया', unassigned: 'असाइन नहीं',
        addComment: 'टिप्पणी जोड़ें', commentAdded: 'टिप्पणी जोड़ी गई', noComments: 'अभी तक कोई टिप्पणी नहीं',
        writeComment: 'टिप्पणी लिखें...', send: 'भेजें', backToDashboard: 'डैशबोर्ड पर वापस जाएं',
        viewBug: 'बग देखें', editBug: 'बग संपादित करें', deleteBug: 'बग हटाएं', confirmDelete: 'हटाने की पुष्टि करें',
        bugDeleted: 'बग हटा दिया गया', noResults: 'कोई परिणाम नहीं', searchResults: 'खोज परिणाम',
        loading: 'लोड हो रहा है...', error: 'एक त्रुटि हुई', success: 'सफलता',
        warning: 'चेतावनी', info: 'जानकारी', confirm: 'पुष्टि करें', yes: 'हां', no: 'नहीं',
        createProject: 'प्रोजेक्ट बनाएं', editProject: 'प्रोजेक्ट संपादित करें', deleteProject: 'प्रोजेक्ट हटाएं',
        projectName: 'प्रोजेक्ट का नाम', projectDesc: 'प्रोजेक्ट विवरण', members: 'सदस्य',
        createdAt: 'बनाया गया', actions: 'कार्य', manageUsers: 'उपयोगकर्ता प्रबंधित करें',
        manageProjects: 'प्रोजेक्ट प्रबंधित करें', userName: 'उपयोगकर्ता नाम', verified: 'सत्यापित',
        pending: 'लंबित', yesVerified: 'सत्यापित', noPending: 'लंबित',
        joinDate: 'शामिल होने की तारीख', changeRole: 'भूमिका बदलें', admin: 'एडमिन',
        developer: 'डेवलपर', tester: 'टेस्टर',
        noProjects: 'अभी कोई प्रोजेक्ट नहीं', noUsers: 'कोई उपयोगकर्ता नहीं मिला', selectRole: 'भूमिका चुनें',
        enterEmail: 'ईमेल दर्ज करें', enterPassword: 'पासवर्ड दर्ज करें', enterName: 'नाम दर्ज करें',
        minLength: 'न्यूनतम लंबाई', passwordTooShort: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए',
        emailRequired: 'ईमेल आवश्यक है', nameRequired: 'नाम आवश्यक है',
        titleRequired: 'शीर्षक आवश्यक है', descriptionRequired: 'विवरण आवश्यक है',
        projectRequired: 'प्रोजेक्ट आवश्यक है', reportSubmitted: 'बग रिपोर्ट सफलतापूर्वक जमा की गई',
        viewAllBugs: 'सभी बग देखें', viewAnalytics: 'विश्लेषण देखें', goToDashboard: 'डैशबोर्ड पर जाएं',
        viewAIEngine: 'एआई इंजन देखें', adminSettings: 'एडमिन सेटिंग्स', logout: 'लॉगआउट',
        myProfile: 'मेरी प्रोफ़ाइल', accountSettings: 'खाता सेटिंग्स', darkMode: 'डार्क मोड',
        lightMode: 'लाइट मोड', appearance: 'दिखावट', preferences: 'प्राथमिकताएं',
        general: 'सामान्य', security: 'सुरक्षा', privacy: 'गोपनीयता',
        recentBugs: 'हाल के बग', myAssignedBugs: 'मेरे असाइन किए गए बग', reportedByMe: 'मेरे द्वारा रिपोर्ट किए गए',
        allBugs: 'सभी बग', openBugs: 'खुले बग', inProgressBugs: 'प्रगति में बग',
        resolvedBugs: 'हल किए गए बग', closedBugs: 'बंद बग', criticalBugs: 'गंभीर बग',
        highPriorityBugs: 'उच्च प्राथमिकता बग', lowPriorityBugs: 'कम प्राथमिकता बग',
        mediumPriorityBugs: 'मध्यम प्राथमिकता बग', bugCount: 'बग गिनती', assignedCount: 'असाइन गिनती',
        resolvedCount: 'हल की गिनती', avgResolutionTime: 'औसत समाधान समय',
        totalUsers: 'कुल उपयोगकर्ता', activeProjects: 'सक्रिय प्रोजेक्ट', systemHealth: 'सिस्टम स्वास्थ्य',
        healthy: 'स्वस्थ', needsAttention: 'ध्यान देने की जरूरत', noActivity: 'कोई हाल की गतिविधि नहीं',
        today: 'आज', yesterday: 'कल', thisWeek: 'इस सप्ताह', thisMonth: 'इस महीने',
        older: 'पुराने', justNow: 'अभी', minutesAgo: 'मिनट पहले', hoursAgo: 'घंटे पहले',
        daysAgo: 'दिन पहले',
    },
};

export function t(key: TranslationKey, lang: Language = 'en'): string {
    return translations[lang]?.[key] || translations['en'][key] || key;
}

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];
