-- Create frontend_texts table for managing all frontend content
CREATE TABLE IF NOT EXISTS frontend_texts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  page TEXT NOT NULL,
  section TEXT,
  category TEXT DEFAULT 'content',
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  default_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE frontend_texts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view frontend texts" ON frontend_texts FOR SELECT USING (true);
CREATE POLICY "Admins can manage frontend texts" ON frontend_texts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_frontend_texts_page ON frontend_texts(page);
CREATE INDEX IF NOT EXISTS idx_frontend_texts_key ON frontend_texts(key);
CREATE INDEX IF NOT EXISTS idx_frontend_texts_category ON frontend_texts(category);

-- Insert default texts for Homepage
INSERT INTO frontend_texts (key, page, section, category, label, value, default_value, description) VALUES
  -- Hero Section
  ('home.hero.title', 'home', 'hero', 'title', 'Título Principal', 'O Seu Refúgio no Coração de Lisboa', 'O Seu Refúgio no Coração de Lisboa', 'Título principal da página inicial'),
  ('home.hero.subtitle', 'home', 'hero', 'description', 'Subtítulo', 'Quartos modernos e confortáveis com todas as comodidades que precisa para uma estadia perfeita', 'Quartos modernos e confortáveis com todas as comodidades que precisa para uma estadia perfeita', 'Descrição abaixo do título'),
  ('home.hero.search_button', 'home', 'hero', 'button', 'Botão Pesquisar', 'Pesquisar', 'Pesquisar', 'Texto do botão de pesquisa'),
  
  -- Features Section
  ('home.features.title', 'home', 'features', 'title', 'Título Comodidades', 'Comodidades Incluídas', 'Comodidades Incluídas', 'Título da secção de comodidades'),
  ('home.features.subtitle', 'home', 'features', 'description', 'Subtítulo Comodidades', 'Tudo o que precisa para uma estadia confortável e memorável', 'Tudo o que precisa para uma estadia confortável e memorável', 'Descrição da secção de comodidades'),
  
  -- Location Section
  ('home.location.badge', 'home', 'location', 'label', 'Badge Localização', 'Localização Premium', 'Localização Premium', 'Badge da secção de localização'),
  ('home.location.title', 'home', 'location', 'title', 'Título Localização', 'No Coração de Arroios, Lisboa', 'No Coração de Arroios, Lisboa', 'Título da secção de localização'),
  ('home.location.description', 'home', 'location', 'description', 'Descrição Localização', 'Localizado numa das zonas mais vibrantes e multiculturais de Lisboa, com fácil acesso a transportes públicos, restaurantes, cafés e atrações turísticas.', 'Localizado numa das zonas mais vibrantes e multiculturais de Lisboa, com fácil acesso a transportes públicos, restaurantes, cafés e atrações turísticas.', 'Descrição da localização'),
  ('home.location.point1', 'home', 'location', 'list', 'Ponto 1', '5 min a pé do Metro de Arroios', '5 min a pé do Metro de Arroios', 'Primeiro ponto de localização'),
  ('home.location.point2', 'home', 'location', 'list', 'Ponto 2', '15 min do centro histórico', '15 min do centro histórico', 'Segundo ponto de localização'),
  ('home.location.point3', 'home', 'location', 'list', 'Ponto 3', '20 min do Aeroporto de Lisboa', '20 min do Aeroporto de Lisboa', 'Terceiro ponto de localização'),
  ('home.location.cta_button', 'home', 'location', 'button', 'Botão Ver Quartos', 'Ver Quartos Disponíveis', 'Ver Quartos Disponíveis', 'Botão de call-to-action na secção de localização'),
  
  -- Testimonials Section
  ('home.testimonials.title', 'home', 'testimonials', 'title', 'Título Avaliações', 'O Que Dizem os Nossos Hóspedes', 'O Que Dizem os Nossos Hóspedes', 'Título da secção de avaliações'),
  ('home.testimonials.subtitle', 'home', 'testimonials', 'description', 'Subtítulo Avaliações', 'Avaliações reais de quem já nos visitou', 'Avaliações reais de quem já nos visitou', 'Descrição da secção de avaliações'),
  
  -- CTA Section
  ('home.cta.title', 'home', 'cta', 'title', 'Título CTA Final', 'Pronto para Reservar a Sua Estadia?', 'Pronto para Reservar a Sua Estadia?', 'Título do call-to-action final'),
  ('home.cta.description', 'home', 'cta', 'description', 'Descrição CTA', 'Descubra os nossos quartos modernos e reserve agora com os melhores preços garantidos', 'Descubra os nossos quartos modernos e reserve agora com os melhores preços garantidos', 'Descrição do CTA final'),
  ('home.cta.primary_button', 'home', 'cta', 'button', 'Botão Principal', 'Ver Todos os Quartos', 'Ver Todos os Quartos', 'Botão principal do CTA'),
  ('home.cta.secondary_button', 'home', 'cta', 'button', 'Botão Secundário', 'Acesso Administração', 'Acesso Administração', 'Botão secundário do CTA')
ON CONFLICT (key) DO NOTHING;

-- Insert texts for Rooms page
INSERT INTO frontend_texts (key, page, section, category, label, value, default_value, description) VALUES
  ('rooms.title', 'rooms', 'header', 'title', 'Título', 'Nossos Quartos', 'Nossos Quartos', 'Título da página de quartos'),
  ('rooms.subtitle', 'rooms', 'header', 'description', 'Subtítulo', 'Encontre o quarto perfeito para a sua estadia', 'Encontre o quarto perfeito para a sua estadia', 'Subtítulo da página de quartos'),
  ('rooms.filter.all_types', 'rooms', 'filters', 'option', 'Filtro Todos', 'Todos os Tipos', 'Todos os Tipos', 'Opção de filtro para todos os tipos'),
  ('rooms.filter.standard', 'rooms', 'filters', 'option', 'Filtro Standard', 'Standard', 'Standard', 'Opção de filtro standard'),
  ('rooms.filter.suite', 'rooms', 'filters', 'option', 'Filtro Suite', 'Suite', 'Suite', 'Opção de filtro suite'),
  ('rooms.filter.large', 'rooms', 'filters', 'option', 'Filtro Large', 'Large', 'Large', 'Opção de filtro large'),
  ('rooms.view_details_button', 'rooms', 'card', 'button', 'Botão Ver Detalhes', 'Ver Detalhes', 'Ver Detalhes', 'Botão para ver detalhes do quarto')
ON CONFLICT (key) DO NOTHING;

-- Insert texts for Checkout page
INSERT INTO frontend_texts (key, page, section, category, label, value, default_value, description) VALUES
  ('checkout.title', 'checkout', 'header', 'title', 'Título', 'Finalizar Reserva', 'Finalizar Reserva', 'Título da página de checkout'),
  ('checkout.guest_info.title', 'checkout', 'form', 'title', 'Informações do Hóspede', 'Informações do Hóspede', 'Informações do Hóspede', 'Título da secção de informações do hóspede'),
  ('checkout.payment.title', 'checkout', 'form', 'title', 'Pagamento', 'Informações de Pagamento', 'Informações de Pagamento', 'Título da secção de pagamento'),
  ('checkout.submit_button', 'checkout', 'form', 'button', 'Botão Confirmar', 'Confirmar Reserva', 'Confirmar Reserva', 'Botão de confirmação de reserva'),
  ('checkout.terms_checkbox', 'checkout', 'form', 'label', 'Termos e Condições', 'Aceito os termos e condições', 'Aceito os termos e condições', 'Texto do checkbox de termos')
ON CONFLICT (key) DO NOTHING;

-- Insert common texts
INSERT INTO frontend_texts (key, page, section, category, label, value, default_value, description) VALUES
  ('common.check_in', 'common', 'labels', 'label', 'Check-in', 'Check-in', 'Check-in', 'Label de check-in'),
  ('common.check_out', 'common', 'labels', 'label', 'Check-out', 'Check-out', 'Check-out', 'Label de check-out'),
  ('common.per_night', 'common', 'labels', 'label', 'Por Noite', 'por noite', 'por noite', 'Texto "por noite"'),
  ('common.loading', 'common', 'messages', 'message', 'Carregando', 'A carregar...', 'A carregar...', 'Mensagem de carregamento'),
  ('common.error', 'common', 'messages', 'message', 'Erro', 'Ocorreu um erro', 'Ocorreu um erro', 'Mensagem de erro genérica'),
  ('common.success', 'common', 'messages', 'message', 'Sucesso', 'Operação concluída com sucesso', 'Operação concluída com sucesso', 'Mensagem de sucesso genérica')
ON CONFLICT (key) DO NOTHING;