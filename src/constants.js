import { BookOpen, FlaskConical, Calculator, Leaf, Trophy, Star, Award, Flame, HelpCircle, CheckCircle2, Target, FileText, Clock, Globe, Lightbulb, AlertTriangle, Database, Cloud, CloudOff, User, Bot, Cat, Dog, Rocket, Crown, Zap, Smile } from 'lucide-react';

export const ICON_MAP = {
    Zap: Star, // Fallback or mapping
    Calculator, FlaskConical, Leaf, Trophy, Star, Award, Flame,
    HelpCircle, CheckCircle2, Target, BookOpen, FileText, Clock, Globe,
    Lightbulb, AlertTriangle, Database, Cloud, CloudOff, User, Bot, Cat, Dog, Rocket, Crown, Zap, Smile
};

export const AVATAR_MAP = {
    'student': { icon: User, label: 'Student', color: 'bg-blue-500' },
    'robot': { icon: Bot, label: 'Robot', color: 'bg-slate-500' },
    'cat': { icon: Cat, label: 'Cat', color: 'bg-orange-400' },
    'dog': { icon: Dog, label: 'Dog', color: 'bg-amber-600' },
    'astronaut': { icon: Rocket, label: 'Astronaut', color: 'bg-indigo-500' },
    'king': { icon: Crown, label: 'Leader', color: 'bg-yellow-500' },
    'wizard': { icon: Zap, label: 'Wizard', color: 'bg-purple-500' },
    'happy': { icon: Smile, label: 'Happy', color: 'bg-emerald-500' }
};

export const calculateSubjectProgress = (subjectKey, userTopics, allTopics) => {
    if (!allTopics || allTopics.length === 0) return 0;
    const completed = allTopics.filter(t => (userTopics[t.id]?.progress || 0) === 100).length;
    return Math.round((completed / allTopics.length) * 100);
};

export const calculateLevel = (xp) => {
    return Math.floor(xp / 100) + 1;
};

export const countCompletedTopics = (subjects, userTopics) => {
    let count = 0;
    Object.values(subjects).forEach(subject => {
        subject.topics.forEach(topic => {
            if ((userTopics[topic.id]?.progress || 0) === 100) {
                count++;
            }
        });
    });
    return count;
};

export const formatStudyTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};
