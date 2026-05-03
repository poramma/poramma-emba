import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, LogIn, ArrowRight, Shield, 
  BookOpen, Clock, Users, Star, Heart, Flag,
  ChevronDown, Quote, Crown, Award, Target
} from 'lucide-react';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';

// Types et interfaces
interface Agent {
  id: string;
  name: string;
  title: string;
  image?: string;
  quote: string;
  color: string;
  credentials: {
    email: string;
    password: string;
  };
}

// Données des agents
const agents: Agent[] = [
  {
    id: 'ambassador',
    name: 'Son Excellence Fafré CAMARA',
    title: 'Ambassadeur du Mali au Maroc',
    image: '/images/user/ambassadeur.jpg',
    quote: "L'éducation est l'arme la plus puissante pour changer le monde. Je souhaite la bienvenue à tous nos agents dévoués qui œuvrent chaque jour pour servir notre communauté estudiantine avec excellence et dévouement.",
    color: 'from-yellow-500 to-red-500',
    credentials: {
      email: 'ambassadeur@ambassade-mali.ma',
      password: '••••••••'
    }
  },
  {
    id: 'agent1',
    name: 'Mamadou Konaté',
    title: 'Agent Consulaire Principal',
    image: '/api/placeholder/150/150',
    quote: "Le service consulaire est une vocation. Chaque jour, nous avons l'honneur d'aider nos compatriotes dans leurs démarches administratives.",
    color: 'from-green-600 to-yellow-500',
    credentials: {
      email: 'm.konate@ambassade-mali.ma',
      password: '••••••••'
    }
  },
  {
    id: 'agent2',
    name: 'Aïssata Diallo',
    title: 'Responsable des Services Étudiants',
    image: '/api/placeholder/150/150',
    quote: "Notre jeunesse estudiantine est l'avenir de notre nation. Mon engagement est de leur offrir un service de qualité et bienveillant.",
    color: 'from-red-500 to-green-600',
    credentials: {
      email: 'a.diallo@ambassade-mali.ma',
      password: '••••••••'
    }
  },
  {
    id: 'agent3',
    name: 'Ousmane Traoré',
    title: 'Chargé des Affaires Administratives',
    image: '/api/placeholder/150/150',
    quote: "L'efficacité administrative au service de la communauté malienne est notre priorité absolue.",
    color: 'from-yellow-500 to-green-600',
    credentials: {
      email: 'o.traore@ambassade-mali.ma',
      password: '••••••••'
    }
  }
];

// Composant AgentCard
const AgentCard: React.FC<{ 
  agent: Agent; 
  isSelected: boolean;
  onSelect: () => void;
}> = ({ agent, isSelected, onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-300 ${
        isSelected ? 'scale-105 shadow-2xl' : 'scale-100 shadow-lg hover:scale-102'
      }`}
      onClick={onSelect}
    >
      <div className={`bg-gradient-to-r ${agent.color} p-1 rounded-2xl`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {agent.image ? (
                  <img
                    src={agent.image}
                    alt={agent.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  agent.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
              {agent.id === 'ambassador' && (
                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {agent.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {agent.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Quote className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              "{agent.quote}"
            </p>
          </div>
          
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Identifiants de connexion
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {agent.credentials.email}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Composant LoginForm
const LoginForm: React.FC<{ 
  agent: Agent;
  onLogin: (credentials: { email: string; password: string }) => void;
}> = ({ agent, onLogin }) => {
  const [email, setEmail] = useState(agent.credentials.email);
  const [password, setPassword] = useState(agent.credentials.password);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulation de connexion
    setTimeout(() => {
      onLogin({ email, password });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-yellow-400 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
          {agent.image ? (
            <img
              src={agent.image}
              alt={agent.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            agent.name.split(' ').map(n => n[0]).join('')
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {agent.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">{agent.title}</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          startIcon={<Mail className="w-5 h-5" />}
          required
        />
        
        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          startIcon={<Lock className="w-5 h-5" />}
          required
        />
        
        <Button
          type="submit"
          variant="primary"
          className="w-full bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
          <LogIn className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.form>
  );
};

// Composant principal WelcomePage
const WelcomePage: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop } = contentRef.current;
        setShowScrollIndicator(scrollTop < 100);
      }
    };

    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      return () => currentRef.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleLogin = (credentials: { email: string; password: string }) => {
    console.log('Connexion attempt:', credentials);
    // Redirection vers le dashboard
    window.location.href = '/dashboard';
  };

  const scrollToContent = () => {
    contentRef.current?.scrollTo({
      top: contentRef.current.clientHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
        
{/* Drapeau du Mali en arrière-plan (VERT - JAUNE - ROUGE vertical) */}
<div className="absolute inset-0 flex opacity-80">
            <div className="flex-1 bg-green-600"></div>
            <div className="flex-1 bg-yellow-400"></div>
            <div className="flex-1 bg-red-500"></div>
        </div>
    {/* Contenu principal */}
    <div
        ref={contentRef}
        className="relative z-10 h-screen overflow-y-auto scroll-smooth"
    >
        {/* Section Hero */}
        <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="text-center text-white max-w-4xl">
            <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-8"
            >
            <Flag className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Bienvenue à l'Ambassade
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
                République du Mali - Royaume du Maroc
            </p>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
                Plateforme de gestion consulaire dédiée au service de la communauté malienne au Maroc
            </p>
            </motion.div>

            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
            <Button
                size="lg"
                variant="outline"
                className="border-white border-2 bg-white text-black hover:bg-white/20 hover:text-green-700"
                onClick={scrollToContent}
            >
                Commencer
                <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
                size="lg"
                variant="ghost"
                className="border-white border-2 bg-white text-black hover:bg-white/20 hover:text-green-700"
            >
                <BookOpen className="w-5 h-5 mr-2" />
                Guide d'utilisation
            </Button>
            </motion.div>

            {/* Indicateur de défilement */}
            {showScrollIndicator && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
                <div className="animate-bounce">
                <ChevronDown className="w-8 h-8 text-white" />
                </div>
            </motion.div>
            )}
        </div>
        </div>

        {/* Section Agents */}
        <div className="min-h-screen bg-white dark:bg-gray-900 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-red-500 text-white px-4 py-2 rounded-full mb-4">
                <Shield className="w-5 h-5" />
                <span>Espace Agent Consulaire</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Nos Agents Dédiés
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Sélectionnez votre profil pour accéder à votre espace de travail sécurisé
              </p>
            </motion.div>

            {/* Grille des agents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <AgentCard
                    agent={agent}
                    isSelected={selectedAgent?.id === agent.id}
                    onSelect={() => setSelectedAgent(
                      selectedAgent?.id === agent.id ? null : agent
                    )}
                  />
                </motion.div>
              ))}
            </div>

            {/* Formulaire de connexion */}
            <AnimatePresence>
              {selectedAgent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-md mx-auto"
                >
                  <LoginForm
                    agent={selectedAgent}
                    onLogin={handleLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Section Valeurs */}
        <div className="bg-gradient-to-r from-green-600 to-yellow-500 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center text-white mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">Nos Valeurs</h2>
              <p className="text-lg opacity-90">
                Les principes qui guident notre action au service de la communauté
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Target className="w-12 h-12" />,
                  title: "Excellence",
                  description: "Un service de qualité supérieure pour répondre aux besoins de nos compatriotes"
                },
                {
                  icon: <Heart className="w-12 h-12" />,
                  title: "Solidarité",
                  description: "L'entraide et le soutien mutuel au cœur de notre communauté"
                },
                {
                  icon: <Award className="w-12 h-12" />,
                  title: "Intégrité",
                  description: "Transparence et honnêteté dans toutes nos actions"
                }
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center text-white"
                >
                  <div className="bg-white/20 p-4 rounded-2xl inline-flex mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="opacity-90">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Flag className="w-8 h-8 text-yellow-400" />
              <span className="text-xl font-bold">Ambassade du Mali au Maroc</span>
            </div>
            <p className="text-gray-400 mb-4">
              Au service de la communauté malienne depuis 1961
            </p>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Plateforme Consulaire - Tous droits réservés
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default WelcomePage;