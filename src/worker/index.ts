import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie } from "hono/cookie";
import {
  authMiddleware,
  getOAuthRedirectUrl,
  exchangeCodeForSessionToken,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import {
  NovoLancamentoSchema
} from "@/shared/types";

type Bindings = {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_KEY: string;
  MOCHA_USERS_SERVICE_API_URL: string;
};

type Variables = {
  user: any;
  userId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("/*", cors());

// Auth routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  if (!c.env.MOCHA_USERS_SERVICE_API_KEY) {
    console.error('Missing MOCHA_USERS_SERVICE_API_KEY environment variable');
    return c.json({ error: 'Server configuration error: Missing API Key' }, 500);
  }

  try {
    const redirectUrl = await getOAuthRedirectUrl('google', {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    return c.json({ redirectUrl }, 200);
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: 'Failed to initialize authentication' }, 500);
  }
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Função utilitária para gerar UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Função para obter data atual no fuso horário do Brasil
function getDataAtualBrasil(): Date {
  const agora = new Date();
  const brasilia = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return brasilia;
}

// Middleware para verificar autenticação em todas as rotas protegidas
app.use("/api/*", async (c, next) => {
  // Pular verificação para rotas de auth
  if (c.req.path.startsWith('/api/oauth/') || c.req.path.startsWith('/api/sessions') || c.req.path === '/api/logout') {
    return next();
  }

  // BACKEND AUTH BYPASS
  c.set('user', {
    id: 'dev-user-id',
    email: 'dev@istore.com',
    name: 'Desenvolvedor'
  });

  await next();
});

// Função para formatar competência (YYYY-MM)
function getCompetencia(data: string): string {
  const date = new Date(data);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/categorias - Listar todas as categorias ativas
app.get("/api/categorias", async (c) => {
  try {
    console.log('[Debug] Iniciando GET /api/categorias');
    const db = c.env.DB;
    const user = c.get("user");

    if (!user || !user.id) {
      console.log('[Debug] Usuário não encontrado ou sem ID');
      return c.json({ error: 'Usuário não encontrado' }, 401);
    }

    console.log('[Debug] User ID:', user.id);

    // Verificar se o usuário já tem categorias padrão
    console.log('[Debug] Verificando categorias existentes...');
    const categoriasExistentes = await db
      .prepare("SELECT COUNT(*) as count FROM categorias WHERE user_id = ? AND ativa = true")
      .bind(user.id)
      .first();

    console.log('[Debug] Categorias existentes:', categoriasExistentes);

    // Se não tem categorias, criar as padrão (apenas uma vez) com verificação de duplicata
    if (categoriasExistentes && categoriasExistentes.count === 0) {
      console.log('[Debug] Criando categorias padrão...');
      const categoriasDefault = [
        { nome: 'Alimentação', icone: 'utensils' },
        { nome: 'Moradia', icone: 'home' },
        { nome: 'Transporte', icone: 'bus' },
        { nome: 'Lazer', icone: 'gamepad' },
        { nome: 'Saúde', icone: 'heart' },
        { nome: 'Educação', icone: 'book' }
      ];

      for (const cat of categoriasDefault) {
        try {
          // Verificar se já existe antes de criar
          const existing = await db
            .prepare("SELECT id FROM categorias WHERE user_id = ? AND LOWER(nome) = LOWER(?) AND ativa = true")
            .bind(user.id, cat.nome)
            .first();

          if (!existing) {
            const id = generateId();
            console.log(`[Debug] Criando categoria: ${cat.nome}`);
            await db
              .prepare(`
                INSERT INTO categorias (id, nome, icone, user_id, ativa, created_at, updated_at)
                VALUES (?, ?, ?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              `)
              .bind(id, cat.nome, cat.icone, user.id)
              .run();
          } else {
            console.log(`[Debug] Categoria ${cat.nome} já existe, pulando...`);
          }
        } catch (error) {
          console.log(`[Debug] Erro ao criar categoria ${cat.nome}:`, error);
          // Ignorar erros de duplicata - pode acontecer em race conditions
        }
      }
    }

    // Buscar categorias do usuário (com DISTINCT para evitar duplicatas)
    console.log('[Debug] Buscando categorias do usuário...');
    const categorias = await db
      .prepare(`
        SELECT DISTINCT id, nome, icone, ativa, limite_mensal, created_at, updated_at, user_id 
        FROM categorias 
        WHERE ativa = ? AND user_id = ? 
        ORDER BY nome
      `)
      .bind(true, user.id)
      .all();

    console.log('[Debug] Categorias encontradas:', categorias);

    if (!categorias || !categorias.results) {
      console.log('[Debug] Nenhuma categoria encontrada, retornando array vazio');
      return c.json([]);
    }

    // Filtrar duplicatas no nível de aplicação também (fallback)
    const categoriasUnicas = categorias.results.filter((categoria: any, index: number, array: any[]) =>
      array.findIndex((c: any) => c.nome.toLowerCase() === categoria.nome.toLowerCase()) === index
    );

    console.log('[Debug] Retornando', categoriasUnicas.length, 'categorias únicas');
    return c.json(categoriasUnicas);

  } catch (error) {
    console.error('[Debug] Erro no endpoint /api/categorias:', error);
    console.error('[Debug] Stack trace:', error instanceof Error ? error.stack : 'No stack');
    return c.json({
      error: 'Erro interno do servidor ao buscar categorias',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// POST /api/categorias - Criar nova categoria
app.post("/api/categorias", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const dados = await c.req.json();

  // Verificar se já existe categoria com esse nome para este usuário (ignorar case)
  const categoriaExistente = await db
    .prepare("SELECT id FROM categorias WHERE user_id = ? AND LOWER(nome) = LOWER(?) AND ativa = true")
    .bind(user?.id, dados.nome)
    .first();

  if (categoriaExistente) {
    return c.json({ error: 'Já existe uma categoria com este nome' }, 400);
  }

  const id = generateId();

  try {
    const resultado = await db
      .prepare(`
        INSERT INTO categorias (id, nome, icone, limite_mensal, user_id, ativa, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      .bind(id, dados.nome, dados.icone || 'circle', dados.limite_mensal || null, user?.id)
      .run();

    if (!resultado.success) {
      console.error('Falha ao inserir categoria:', resultado);
      return c.json({ error: 'Erro ao salvar categoria no banco de dados' }, 500);
    }

    const novaCategoria = await db
      .prepare("SELECT * FROM categorias WHERE id = ? AND user_id = ?")
      .bind(id, user?.id)
      .first();

    if (!novaCategoria) {
      console.error('Categoria não encontrada após inserção');
      return c.json({ error: 'Categoria não foi criada corretamente' }, 500);
    }

    return c.json(novaCategoria);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return c.json({ error: `Erro ao criar categoria: ${errorMessage}` }, 500);
  }
});

// PUT /api/categorias/:id - Editar categoria
app.put("/api/categorias/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = c.req.param("id");
  const dados = await c.req.json();

  await db
    .prepare(`
      UPDATE categorias SET
        nome = ?, icone = ?, limite_mensal = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `)
    .bind(dados.nome, dados.icone, dados.limite_mensal, id, user?.id)
    .run();

  const categoriaAtualizada = await db
    .prepare("SELECT * FROM categorias WHERE id = ? AND user_id = ?")
    .bind(id, user?.id)
    .first();

  return c.json(categoriaAtualizada);
});

// DELETE /api/categorias/:id - Excluir categoria
app.delete("/api/categorias/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = c.req.param("id");

  await db
    .prepare("UPDATE categorias SET ativa = false WHERE id = ? AND user_id = ?")
    .bind(id, user?.id)
    .run();

  return c.json({ success: true });
});

// PUT /api/categorias/:id/limite - Definir limite para categoria
app.put("/api/categorias/:id/limite", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = c.req.param("id");
  const dados = await c.req.json();

  await db
    .prepare(`
      UPDATE categorias SET
        limite_mensal = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `)
    .bind(dados.limite_mensal, id, user?.id)
    .run();

  return c.json({ success: true });
});

// GET /api/lancamentos - Listar lançamentos com filtros opcionais
app.get("/api/lancamentos", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const periodo = c.req.query("periodo") || "mes-atual";

  let whereClause = "l.user_id = ?";
  let params: any[] = [user?.id];

  // Função para obter data atual no fuso horário do Brasil
  const getDataAtualBrasil = () => {
    const agora = new Date();
    const brasilia = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    return brasilia;
  };

  // Aplicar filtro de período usando horário do Brasil
  const hoje = getDataAtualBrasil();
  hoje.setHours(0, 0, 0, 0);

  console.log(`[Debug] Filtro período: ${periodo}, Data Brasil hoje: ${hoje.toISOString().split('T')[0]}`);

  // Verificar se é período personalizado
  if (periodo.startsWith('custom:')) {
    const [, dataInicio, dataFim] = periodo.split(':');
    whereClause += " AND l.data >= ? AND l.data <= ?";
    params.push(dataInicio, dataFim);
    console.log(`[Debug] Período custom: ${dataInicio} até ${dataFim}`);
  } else {
    switch (periodo) {
      case "hoje":
        const hojeFmt = hoje.toISOString().split('T')[0];
        whereClause += " AND l.data = ?";
        params.push(hojeFmt);
        console.log(`[Debug] Filtro hoje: ${hojeFmt}`);
        break;
      case "semana":
        // Calcular início da semana (segunda-feira) no horário do Brasil
        const inicioSemana = new Date(hoje);
        const diaAtual = hoje.getDay();
        const diasParaSegunda = diaAtual === 0 ? -6 : 1 - diaAtual;
        inicioSemana.setDate(hoje.getDate() + diasParaSegunda);

        // Calcular fim da semana (domingo)
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);

        const inicioSemanaFmt = inicioSemana.toISOString().split('T')[0];
        const fimSemanaFmt = fimSemana.toISOString().split('T')[0];

        whereClause += " AND l.data >= ? AND l.data <= ?";
        params.push(inicioSemanaFmt, fimSemanaFmt);
        console.log(`[Debug] Filtro semana: ${inicioSemanaFmt} até ${fimSemanaFmt}`);
        break;
      case "mes-atual":
        // Primeiro e último dia do mês atual no horário do Brasil
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();
        const inicioMes = new Date(anoAtual, mesAtual, 1);
        const fimMes = new Date(anoAtual, mesAtual + 1, 0);

        const inicioMesFmt = inicioMes.toISOString().split('T')[0];
        const fimMesFmt = fimMes.toISOString().split('T')[0];

        whereClause += " AND l.data >= ? AND l.data <= ?";
        params.push(inicioMesFmt, fimMesFmt);
        console.log(`[Debug] Filtro mês atual: ${inicioMesFmt} até ${fimMesFmt}`);
        break;
      case "mes-passado":
        const anoPassado = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
        const mesPassado = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
        const inicioMesPassado = new Date(anoPassado, mesPassado, 1);
        const fimMesPassado = new Date(anoPassado, mesPassado + 1, 0);

        const inicioMesPassadoFmt = inicioMesPassado.toISOString().split('T')[0];
        const fimMesPassadoFmt = fimMesPassado.toISOString().split('T')[0];

        whereClause += " AND l.data >= ? AND l.data <= ?";
        params.push(inicioMesPassadoFmt, fimMesPassadoFmt);
        console.log(`[Debug] Filtro mês passado: ${inicioMesPassadoFmt} até ${fimMesPassadoFmt}`);
        break;
      case "ano":
        const anoCompleto = hoje.getFullYear();
        const inicioAno = new Date(anoCompleto, 0, 1);
        const fimAno = new Date(anoCompleto, 11, 31);

        const inicioAnoFmt = inicioAno.toISOString().split('T')[0];
        const fimAnoFmt = fimAno.toISOString().split('T')[0];

        whereClause += " AND l.data >= ? AND l.data <= ?";
        params.push(inicioAnoFmt, fimAnoFmt);
        console.log(`[Debug] Filtro ano: ${inicioAnoFmt} até ${fimAnoFmt}`);
        break;
    }
  }

  const query = `
    SELECT l.*, c.nome as categoria_nome, c.icone as categoria_icone
    FROM lancamentos l
    LEFT JOIN categorias c ON l.categoria_id = c.id AND c.user_id = l.user_id
    WHERE ${whereClause}
    ORDER BY l.data DESC, l.created_at DESC
  `;

  console.log(`[Debug] Query final: ${query}`);
  console.log(`[Debug] Params: ${JSON.stringify(params)}`);

  const lancamentos = await db.prepare(query).bind(...params).all();

  console.log(`[Debug] Lançamentos encontrados: ${lancamentos.results?.length || 0}`);

  return c.json(lancamentos.results);
});

// POST /api/lancamentos - Criar novo lançamento
app.post("/api/lancamentos", zValidator("json", NovoLancamentoSchema), async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const dados = c.req.valid("json");

  const id = generateId();
  const competencia = getCompetencia(dados.data);

  // Para despesas, o valor deve ser negativo
  const valor = dados.tipo === 'despesa' ? -Math.abs(dados.valor) : dados.valor;

  // Status padrão: receitas sempre "pago", despesas "pago" exceto cartão que fica "pendente"
  const status = dados.tipo === 'receita' ? 'pago' :
    dados.forma_pagamento === 'Cartão' ? 'pendente' : 'pago';

  await db
    .prepare(`
      INSERT INTO lancamentos (
        id, tipo, descricao, categoria_id, valor, data, 
        forma_pagamento, cartao_id, status, competencia, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      dados.tipo,
      dados.descricao,
      dados.categoria_id || null,
      valor,
      dados.data,
      dados.forma_pagamento,
      dados.cartao_id || null,
      status,
      competencia,
      user?.id
    )
    .run();

  const novoLancamento = await db
    .prepare(`
      SELECT l.*, c.nome as categoria_nome, c.icone as categoria_icone
      FROM lancamentos l
      LEFT JOIN categorias c ON l.categoria_id = c.id AND c.user_id = l.user_id
      WHERE l.id = ? AND l.user_id = ?
    `)
    .bind(id, user?.id)
    .first();

  return c.json(novoLancamento);
});

// PUT /api/lancamentos/:id - Editar lançamento
app.put("/api/lancamentos/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = c.req.param("id");
  const dados = await c.req.json();

  const competencia = getCompetencia(dados.data);
  const valor = dados.tipo === 'despesa' ? -Math.abs(dados.valor) : dados.valor;

  await db
    .prepare(`
      UPDATE lancamentos SET
        tipo = ?, descricao = ?, categoria_id = ?, valor = ?, data = ?,
        forma_pagamento = ?, cartao_id = ?, status = ?, competencia = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `)
    .bind(
      dados.tipo,
      dados.descricao,
      dados.categoria_id || null,
      valor,
      dados.data,
      dados.forma_pagamento,
      dados.cartao_id || null,
      dados.status,
      competencia,
      id,
      user?.id
    )
    .run();

  const lancamentoAtualizado = await db
    .prepare(`
      SELECT l.*, c.nome as categoria_nome, c.icone as categoria_icone
      FROM lancamentos l
      LEFT JOIN categorias c ON l.categoria_id = c.id AND c.user_id = l.user_id
      WHERE l.id = ? AND l.user_id = ?
    `)
    .bind(id, user?.id)
    .first();

  return c.json(lancamentoAtualizado);
});

// DELETE /api/lancamentos/:id - Excluir lançamento
app.delete("/api/lancamentos/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = c.req.param("id");

  await db
    .prepare("DELETE FROM lancamentos WHERE id = ? AND user_id = ?")
    .bind(id, user?.id)
    .run();

  return c.json({ success: true });
});

// GET /api/dashboard/stats - Estatísticas do dashboard
app.get("/api/dashboard/stats", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const periodo = c.req.query("periodo") || "mes-atual";

  let whereClause = "user_id = ?";
  let params: any[] = [user?.id];

  // Aplicar mesmo filtro de período dos lançamentos - usar horário do Brasil
  const hoje = getDataAtualBrasil();
  hoje.setHours(0, 0, 0, 0);

  // Verificar se é período personalizado
  if (periodo.startsWith('custom:')) {
    const [, dataInicio, dataFim] = periodo.split(':');
    whereClause += " AND data >= ? AND data <= ?";
    params.push(dataInicio, dataFim);
  } else {
    switch (periodo) {
      case "hoje":
        const hojeFmt = hoje.toISOString().split('T')[0];
        whereClause += " AND data = ?";
        params.push(hojeFmt);
        break;
      case "semana":
        // Calcular início da semana (segunda-feira)
        const inicioSemana = new Date(hoje);
        const diaAtual = hoje.getDay();
        const diasParaSegunda = diaAtual === 0 ? -6 : 1 - diaAtual;
        inicioSemana.setDate(hoje.getDate() + diasParaSegunda);

        // Calcular fim da semana (domingo)
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);

        whereClause += " AND data >= ? AND data <= ?";
        params.push(inicioSemana.toISOString().split('T')[0], fimSemana.toISOString().split('T')[0]);
        break;
      case "mes-atual":
        // Primeiro e último dia do mês atual
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();
        const inicioMes = new Date(anoAtual, mesAtual, 1);
        const fimMes = new Date(anoAtual, mesAtual + 1, 0);

        whereClause += " AND data >= ? AND data <= ?";
        params.push(inicioMes.toISOString().split('T')[0], fimMes.toISOString().split('T')[0]);
        break;
      case "mes-passado":
        const anoPassado = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
        const mesPassado = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
        const inicioMesPassado = new Date(anoPassado, mesPassado, 1);
        const fimMesPassado = new Date(anoPassado, mesPassado + 1, 0);

        whereClause += " AND data >= ? AND data <= ?";
        params.push(inicioMesPassado.toISOString().split('T')[0], fimMesPassado.toISOString().split('T')[0]);
        break;
      case "ano":
        const anoCompleto = hoje.getFullYear();
        const inicioAno = new Date(anoCompleto, 0, 1);
        const fimAno = new Date(anoCompleto, 11, 31);

        whereClause += " AND data >= ? AND data <= ?";
        params.push(inicioAno.toISOString().split('T')[0], fimAno.toISOString().split('T')[0]);
        break;
    }
  }

  // Calcular saldo total do período
  const saldoResult = await db
    .prepare(`SELECT COALESCE(SUM(valor), 0) as saldo FROM lancamentos WHERE ${whereClause}`)
    .bind(...params)
    .first();

  // Calcular total de receitas
  const receitasResult = await db
    .prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM lancamentos WHERE ${whereClause} AND tipo = 'receita'`)
    .bind(...params)
    .first();

  // Calcular total de despesas (em valor absoluto)
  const despesasResult = await db
    .prepare(`SELECT COALESCE(ABS(SUM(valor)), 0) as total FROM lancamentos WHERE ${whereClause} AND tipo = 'despesa'`)
    .bind(...params)
    .first();

  // Categoria que mais gastou no período especificado
  const categoriaMaisGasta = await db
    .prepare(`
      SELECT c.nome, ABS(SUM(l.valor)) as total
      FROM lancamentos l
      JOIN categorias c ON l.categoria_id = c.id
      WHERE ${whereClause.replace('user_id = ?', 'l.user_id = ?')} AND l.tipo = 'despesa'
      GROUP BY l.categoria_id, c.nome
      ORDER BY total DESC
      LIMIT 1
    `)
    .bind(...params)
    .first();

  const stats = {
    saldo_periodo: Number(saldoResult?.saldo || 0),
    total_receitas: Number(receitasResult?.total || 0),
    total_despesas: Number(despesasResult?.total || 0),
    categoria_mais_gasta: categoriaMaisGasta ? {
      nome: categoriaMaisGasta.nome,
      valor: Number(categoriaMaisGasta.total)
    } : null
  };

  return c.json(stats);
});

// GET /api/dashboard/gastos-categoria - Gastos por categoria para gráfico
app.get("/api/dashboard/gastos-categoria", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const periodo = c.req.query("periodo") || "mes-atual";

  let whereClause = "l.user_id = ?";
  let params: any[] = [user?.id];

  // Aplicar mesmo filtro de período usando horário do Brasil
  const hoje = getDataAtualBrasil();
  hoje.setHours(0, 0, 0, 0);

  // Verificar se é período personalizado
  if (periodo.startsWith('custom:')) {
    const [, dataInicio, dataFim] = periodo.split(':');
    whereClause += " AND l.data >= ? AND l.data <= ?";
    params.push(dataInicio, dataFim);
  } else {
    switch (periodo) {
      case "hoje":
        const hojeFmt = hoje.toISOString().split('T')[0];
        whereClause += " AND l.data = ?";
        params.push(hojeFmt);
        break;
      case "semana":
        // Calcular início da semana (segunda-feira) no horário do Brasil
        const inicioSemana = new Date(hoje);
        const diaAtual = hoje.getDay();
        const diasParaSegunda = diaAtual === 0 ? -6 : 1 - diaAtual;
        inicioSemana.setDate(hoje.getDate() + diasParaSegunda);

        // Calcular fim da semana (domingo)
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);

        whereClause += " AND l.data >= ? AND l.data <= ?";
        params.push(inicioSemana.toISOString().split('T')[0], fimSemana.toISOString().split('T')[0]);
        break;
      case "mes-atual":
        // Primeiro e último dia do mês atual no horário do Brasil
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();
        const inicioMes = new Date(anoAtual, mesAtual, 1);
        const fimMes = new Date(anoAtual, mesAtual + 1, 0);

        whereClause += " AND l.data >= ? AND l.data <= ?";
        params.push(inicioMes.toISOString().split('T')[0], fimMes.toISOString().split('T')[0]);
        break;
      case "mes-passado":
        const anoPassado = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
        const mesPassado = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
        const inicioMesPassado = new Date(anoPassado, mesPassado, 1);
        const fimMesPassado = new Date(anoPassado, mesPassado + 1, 0);

        whereClause += " AND l.data >= ? AND l.data <= ?";
        params.push(inicioMesPassado.toISOString().split('T')[0], fimMesPassado.toISOString().split('T')[0]);
        break;
      case "ano":
        const anoCompleto = hoje.getFullYear();
        const inicioAno = new Date(anoCompleto, 0, 1);
        const fimAno = new Date(anoCompleto, 11, 31);

        whereClause += " AND l.data >= ? AND l.data <= ?";
        params.push(inicioAno.toISOString().split('T')[0], fimAno.toISOString().split('T')[0]);
        break;
    }
  }

  const gastos = await db
    .prepare(`
      SELECT 
        l.categoria_id,
        c.nome as categoria_nome,
        c.icone as categoria_icone,
        ABS(SUM(l.valor)) as total
      FROM lancamentos l
      JOIN categorias c ON l.categoria_id = c.id AND c.user_id = l.user_id
      WHERE ${whereClause} AND l.tipo = 'despesa'
      GROUP BY l.categoria_id, c.nome, c.icone
      ORDER BY total DESC
    `)
    .bind(...params)
    .all();

  return c.json(gastos.results);
});

// GET /api/cartoes - Listar todos os cartões
app.get("/api/cartoes", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");

  const cartoes = await db
    .prepare("SELECT * FROM cartoes WHERE user_id = ? ORDER BY nome")
    .bind(user?.id)
    .all();

  console.log('Safari Debug - Backend - Cartões recuperados do banco:', cartoes.results);
  if (cartoes.results && cartoes.results.length > 0) {
    cartoes.results.forEach((cartao: any, index: number) => {
      console.log(`Safari Debug - Backend - Cartão ${index + 1}:`, cartao);
      console.log(`Safari Debug - Backend - Cor do cartão ${index + 1}:`, cartao.cor);
      console.log(`Safari Debug - Backend - Bandeira do cartão ${index + 1}:`, cartao.bandeira);
    });
  }

  return c.json(cartoes.results);
});

// POST /api/cartoes - Criar novo cartão
app.post("/api/cartoes", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const dados = await c.req.json();

  console.log('Safari Debug - Backend - Dados recebidos para criar cartão:', dados);
  console.log('Safari Debug - Backend - Cor recebida:', dados.cor);
  console.log('Safari Debug - Backend - Bandeira recebida:', dados.bandeira);

  // Validar dados obrigatórios
  if (!dados.nome || !dados.fechamento_dia || !dados.vencimento_dia) {
    return c.json({ error: 'Nome, dia de fechamento e dia de vencimento são obrigatórios' }, 400);
  }

  // Converter e validar dias
  const fechamentoDia = parseInt(dados.fechamento_dia);
  const vencimentoDia = parseInt(dados.vencimento_dia);

  if (isNaN(fechamentoDia) || fechamentoDia < 1 || fechamentoDia > 31 ||
    isNaN(vencimentoDia) || vencimentoDia < 1 || vencimentoDia > 31) {
    return c.json({ error: 'Dias de fechamento e vencimento devem estar entre 1 e 31' }, 400);
  }

  const id = generateId();

  // Garantir valores padrão para campos obrigatórios do Safari
  const corFinal = dados.cor && typeof dados.cor === 'string' && dados.cor.trim() !== '' ? dados.cor.trim() : 'azul';
  const bandeiraFinal = dados.bandeira && typeof dados.bandeira === 'string' && dados.bandeira.trim() !== '' ? dados.bandeira.trim() : null;

  console.log('Safari Debug - Backend - Cor final a ser salva:', corFinal);
  console.log('Safari Debug - Backend - Bandeira final a ser salva:', bandeiraFinal);

  try {
    // Tentar inserir com todas as colunas primeiro
    let resultado;
    try {
      resultado = await db
        .prepare(`
          INSERT INTO cartoes (id, nome, final4, fechamento_dia, vencimento_dia, limite_mensal, user_id, cor, bandeira, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(
          id,
          dados.nome,
          dados.final4 || null,
          fechamentoDia,
          vencimentoDia,
          dados.limite_mensal ? parseFloat(dados.limite_mensal) : null,
          user?.id,
          corFinal,
          bandeiraFinal
        )
        .run();
    } catch (error) {
      // Se falhar, tentar sem as colunas cor e bandeira
      console.log('Tentando inserir sem colunas cor e bandeira:', error);
      resultado = await db
        .prepare(`
          INSERT INTO cartoes (id, nome, final4, fechamento_dia, vencimento_dia, limite_mensal, user_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(
          id,
          dados.nome,
          dados.final4 || null,
          fechamentoDia,
          vencimentoDia,
          dados.limite_mensal ? parseFloat(dados.limite_mensal) : null,
          user?.id
        )
        .run();
    }

    if (!resultado.success) {
      console.error('Safari Debug - Backend - Falha ao inserir cartão:', resultado);
      return c.json({ error: 'Erro ao salvar cartão no banco de dados' }, 500);
    }

    const novoCartao = await db
      .prepare("SELECT * FROM cartoes WHERE id = ? AND user_id = ?")
      .bind(id, user?.id)
      .first();

    console.log('Safari Debug - Backend - Cartão criado e recuperado do banco:', novoCartao);
    console.log('Safari Debug - Backend - Cor salva no banco:', novoCartao?.cor);
    console.log('Safari Debug - Backend - Bandeira salva no banco:', novoCartao?.bandeira);

    return c.json(novoCartao);
  } catch (error) {
    console.error('Safari Debug - Backend - Erro ao criar cartão:', error);
    console.error('Safari Debug - Backend - Dados recebidos:', dados);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return c.json({ error: 'Erro ao criar cartão: ' + errorMessage }, 500);
  }
});

// PUT /api/cartoes/:id - Editar cartão
app.put("/api/cartoes/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = c.req.param("id");
  const dados = await c.req.json();

  console.log('Safari Debug - Backend - Dados recebidos para editar cartão:', dados);
  console.log('Safari Debug - Backend - ID do cartão:', id);
  console.log('Safari Debug - Backend - Cor recebida:', dados.cor);
  console.log('Safari Debug - Backend - Bandeira recebida:', dados.bandeira);

  // Garantir valores padrão para campos obrigatórios do Safari
  const corFinal = dados.cor && typeof dados.cor === 'string' && dados.cor.trim() !== '' ? dados.cor.trim() : 'azul';
  const bandeiraFinal = dados.bandeira && typeof dados.bandeira === 'string' && dados.bandeira.trim() !== '' ? dados.bandeira.trim() : null;

  console.log('Safari Debug - Backend - Cor final a ser atualizada:', corFinal);
  console.log('Safari Debug - Backend - Bandeira final a ser atualizada:', bandeiraFinal);

  try {
    // Primeiro, verificar se o cartão existe e verificar quais colunas estão disponíveis
    const cartaoExistente = await db
      .prepare("SELECT * FROM cartoes WHERE id = ? AND user_id = ?")
      .bind(id, user?.id)
      .first();

    if (!cartaoExistente) {
      return c.json({ error: 'Cartão não encontrado' }, 404);
    }

    // Tentar atualizar com todas as colunas primeiro
    let result;
    try {
      result = await db
        .prepare(`
          UPDATE cartoes SET
            nome = ?, final4 = ?, fechamento_dia = ?, vencimento_dia = ?, 
            limite_mensal = ?, cor = ?, bandeira = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `)
        .bind(
          dados.nome,
          dados.final4,
          dados.fechamento_dia,
          dados.vencimento_dia,
          dados.limite_mensal,
          corFinal,
          bandeiraFinal,
          id,
          user?.id
        )
        .run();
    } catch (error) {
      // Se falhar, tentar sem as colunas cor e bandeira
      console.log('Tentando atualizar sem colunas cor e bandeira:', error);
      result = await db
        .prepare(`
          UPDATE cartoes SET
            nome = ?, final4 = ?, fechamento_dia = ?, vencimento_dia = ?, 
            limite_mensal = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `)
        .bind(
          dados.nome,
          dados.final4,
          dados.fechamento_dia,
          dados.vencimento_dia,
          dados.limite_mensal,
          id,
          user?.id
        )
        .run();
    }

    console.log('Safari Debug - Backend - Resultado da atualização:', result);

    if (!result.success) {
      console.error('Safari Debug - Backend - Falha ao atualizar cartão:', result);
      return c.json({ error: 'Erro ao atualizar cartão no banco de dados' }, 500);
    }

    const cartaoAtualizado = await db
      .prepare("SELECT * FROM cartoes WHERE id = ? AND user_id = ?")
      .bind(id, user?.id)
      .first();

    console.log('Safari Debug - Backend - Cartão atualizado recuperado do banco:', cartaoAtualizado);
    console.log('Safari Debug - Backend - Cor atualizada no banco:', cartaoAtualizado?.cor);
    console.log('Safari Debug - Backend - Bandeira atualizada no banco:', cartaoAtualizado?.bandeira);

    return c.json(cartaoAtualizado);
  } catch (error) {
    console.error('Safari Debug - Backend - Erro ao editar cartão:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return c.json({ error: 'Erro ao editar cartão: ' + errorMessage }, 500);
  }
});

// DELETE /api/cartoes/:id - Excluir cartão
app.delete("/api/cartoes/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = c.req.param("id");

  await db
    .prepare("DELETE FROM cartoes WHERE id = ? AND user_id = ?")
    .bind(id, user?.id)
    .run();

  return c.json({ success: true });
});

// PUT /api/cartoes/:id/limite - Definir limite para cartão
app.put("/api/cartoes/:id/limite", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = c.req.param("id");
  const dados = await c.req.json();

  await db
    .prepare(`
      UPDATE cartoes SET
        limite_mensal = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `)
    .bind(dados.limite_mensal, id, user?.id)
    .run();

  return c.json({ success: true });
});

// GET /api/cartoes/gastos - Gastos por cartão no mês atual
app.get("/api/cartoes/gastos", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");

  const hoje = new Date();
  const competenciaAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  const gastos = await db
    .prepare(`
      SELECT 
        cartao_id,
        ABS(SUM(valor)) as total
      FROM lancamentos
      WHERE cartao_id IS NOT NULL 
        AND tipo = 'despesa' 
        AND competencia = ?
        AND user_id = ?
      GROUP BY cartao_id
    `)
    .bind(competenciaAtual, user?.id)
    .all();

  return c.json(gastos.results);
});

// GET /api/lancamentos-fixos - Listar lançamentos fixos do usuário
app.get("/api/lancamentos-fixos", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");

  const lancamentosFixos = await db
    .prepare(`
      SELECT lf.*, c.nome as categoria_nome, c.icone as categoria_icone
      FROM lancamentos_fixos lf
      LEFT JOIN categorias c ON lf.categoria_id = c.id AND c.user_id = lf.user_id
      WHERE lf.user_id = ? AND lf.ativo = true
      ORDER BY lf.created_at DESC
    `)
    .bind(user?.id)
    .all();

  return c.json(lancamentosFixos.results);
});

// POST /api/lancamentos-fixos - Criar novo lançamento fixo
app.post("/api/lancamentos-fixos", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const dados = await c.req.json();

  const id = generateId();

  // Calcular próximo lançamento baseado na periodicidade
  const calcularProximoLancamento = (periodicidade: string, dia_semana?: number | null, dia_mes_1?: number | null) => {
    const hoje = getDataAtualBrasil();
    const proxima = new Date(hoje);

    switch (periodicidade) {
      case 'diario':
        proxima.setDate(hoje.getDate() + 1);
        break;
      case 'semanal':
        const diasAteProximaOcorrencia = ((Number(dia_semana) || 1) - hoje.getDay() + 7) % 7;
        if (diasAteProximaOcorrencia === 0) {
          proxima.setDate(hoje.getDate() + 7); // Próxima semana
        } else {
          proxima.setDate(hoje.getDate() + diasAteProximaOcorrencia);
        }
        break;
      case 'quinzenal':
      case 'mensal':
        const diaAlvo = Number(dia_mes_1) || 1;
        proxima.setDate(diaAlvo);
        if (proxima <= hoje) {
          proxima.setMonth(proxima.getMonth() + 1);
        }
        break;
    }

    return proxima.toISOString().split('T')[0];
  };

  const proximoLancamento = calcularProximoLancamento(dados.periodicidade, dados.dia_semana, dados.dia_mes_1);

  await db
    .prepare(`
      INSERT INTO lancamentos_fixos (
        id, tipo, nome, categoria_id, valor, icone, periodicidade,
        dia_semana, dia_mes_1, dia_mes_2, proximo_lancamento, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      dados.tipo,
      dados.nome,
      dados.categoria_id || null,
      dados.valor,
      dados.icone,
      dados.periodicidade,
      dados.dia_semana || null,
      dados.dia_mes_1 || null,
      dados.dia_mes_2 || null,
      proximoLancamento,
      user?.id
    )
    .run();

  const novoLancamentoFixo = await db
    .prepare(`
      SELECT lf.*, c.nome as categoria_nome, c.icone as categoria_icone
      FROM lancamentos_fixos lf
      LEFT JOIN categorias c ON lf.categoria_id = c.id AND c.user_id = lf.user_id
      WHERE lf.id = ? AND lf.user_id = ?
    `)
    .bind(id, user?.id)
    .first();

  return c.json(novoLancamentoFixo);
});

// PUT /api/lancamentos-fixos/:id - Editar lançamento fixo
app.put("/api/lancamentos-fixos/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = c.req.param("id");
  const dados = await c.req.json();

  // Recalcular próximo lançamento
  const calcularProximoLancamento = (periodicidade: string, dia_semana?: number | null, dia_mes_1?: number | null) => {
    const hoje = getDataAtualBrasil();
    const proxima = new Date(hoje);

    switch (periodicidade) {
      case 'diario':
        proxima.setDate(hoje.getDate() + 1);
        break;
      case 'semanal':
        const diasAteProximaOcorrencia = ((Number(dia_semana) || 1) - hoje.getDay() + 7) % 7;
        if (diasAteProximaOcorrencia === 0) {
          proxima.setDate(hoje.getDate() + 7);
        } else {
          proxima.setDate(hoje.getDate() + diasAteProximaOcorrencia);
        }
        break;
      case 'quinzenal':
      case 'mensal':
        const diaAlvo = Number(dia_mes_1) || 1;
        proxima.setDate(diaAlvo);
        if (proxima <= hoje) {
          proxima.setMonth(proxima.getMonth() + 1);
        }
        break;
    }

    return proxima.toISOString().split('T')[0];
  };

  const proximoLancamento = calcularProximoLancamento(dados.periodicidade, dados.dia_semana, dados.dia_mes_1);

  await db
    .prepare(`
      UPDATE lancamentos_fixos SET
        tipo = ?, nome = ?, categoria_id = ?, valor = ?, icone = ?,
        periodicidade = ?, dia_semana = ?, dia_mes_1 = ?, dia_mes_2 = ?,
        proximo_lancamento = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `)
    .bind(
      dados.tipo,
      dados.nome,
      dados.categoria_id || null,
      dados.valor,
      dados.icone,
      dados.periodicidade,
      dados.dia_semana || null,
      dados.dia_mes_1 || null,
      dados.dia_mes_2 || null,
      proximoLancamento,
      id,
      user?.id
    )
    .run();

  const lancamentoAtualizado = await db
    .prepare(`
      SELECT lf.*, c.nome as categoria_nome, c.icone as categoria_icone
      FROM lancamentos_fixos lf
      LEFT JOIN categorias c ON lf.categoria_id = c.id AND c.user_id = lf.user_id
      WHERE lf.id = ? AND lf.user_id = ?
    `)
    .bind(id, user?.id)
    .first();

  return c.json(lancamentoAtualizado);
});

// DELETE /api/lancamentos-fixos/:id - Excluir lançamento fixo
app.delete("/api/lancamentos-fixos/:id", async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = c.req.param("id");

  await db
    .prepare("UPDATE lancamentos_fixos SET ativo = false WHERE id = ? AND user_id = ?")
    .bind(id, user?.id)
    .run();

  return c.json({ success: true });
});

// Função para processar lançamentos fixos automaticamente
const processarLancamentosFixos = async (db: D1Database) => {
  const hoje = getDataAtualBrasil();
  hoje.setHours(0, 1, 0, 0); // 00h01 horário de Brasília
  const hojeStr = hoje.toISOString().split('T')[0];

  // Buscar lançamentos fixos que devem ser processados hoje
  const lancamentosParaProcessar = await db
    .prepare(`
      SELECT * FROM lancamentos_fixos 
      WHERE ativo = true AND proximo_lancamento <= ?
    `)
    .bind(hojeStr)
    .all();

  let processados = 0;

  for (const lancamentoFixo of lancamentosParaProcessar.results || []) {
    try {
      // Criar o lançamento
      const idLancamento = generateId();
      const competencia = getCompetencia(hojeStr);
      const valor = lancamentoFixo.tipo === 'despesa' ? -Math.abs(Number(lancamentoFixo.valor)) : Number(lancamentoFixo.valor);

      await db
        .prepare(`
          INSERT INTO lancamentos (
            id, tipo, descricao, categoria_id, valor, data, 
            forma_pagamento, status, competencia, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          idLancamento,
          lancamentoFixo.tipo,
          `${lancamentoFixo.nome} (Automático)`,
          lancamentoFixo.categoria_id,
          valor,
          hojeStr,
          'Pix', // Forma de pagamento padrão para automáticos
          'pago',
          competencia,
          lancamentoFixo.user_id
        )
        .run();

      // Calcular próximo lançamento
      const calcularProximoLancamento = (lf: any) => {
        const proxima = new Date(hojeStr);

        switch (lf.periodicidade) {
          case 'diario':
            proxima.setDate(proxima.getDate() + 1);
            break;
          case 'semanal':
            proxima.setDate(proxima.getDate() + 7);
            break;
          case 'quinzenal':
            // Para quinzenal, alternar entre os dois dias
            const diaAtual = parseInt(hojeStr.split('-')[2]);
            if (diaAtual === Number(lf.dia_mes_1)) {
              proxima.setDate(Number(lf.dia_mes_2) || 15);
            } else {
              proxima.setMonth(proxima.getMonth() + 1);
              proxima.setDate(Number(lf.dia_mes_1) || 1);
            }
            break;
          case 'mensal':
            proxima.setMonth(proxima.getMonth() + 1);
            proxima.setDate(Number(lf.dia_mes_1) || 1);
            break;
        }

        return proxima.toISOString().split('T')[0];
      };

      const proximoLancamento = calcularProximoLancamento(lancamentoFixo);

      // Atualizar próximo lançamento
      await db
        .prepare(`
          UPDATE lancamentos_fixos SET 
            proximo_lancamento = ?, 
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(proximoLancamento, lancamentoFixo.id)
        .run();

      processados++;
    } catch (error) {
      console.error(`Erro ao processar lançamento fixo ${lancamentoFixo.id}:`, error);
    }
  }

  return { processados, total: lancamentosParaProcessar.results?.length || 0 };
};

// POST /api/processar-lancamentos-fixos - Processar lançamentos fixos pendentes (será chamado por cron job)
app.post("/api/processar-lancamentos-fixos", async (c) => {
  const resultado = await processarLancamentosFixos(c.env.DB);
  return c.json(resultado);
});

// Catch-all route para servir o React app
app.get("*", async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta property="og:title" content="Flow"/>
    <meta property="og:description" content="Controle financeiro inteligente e minimalista"/>
    <meta property="og:image" content="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-favicon.png" type="image/png"/>
    <meta property="og:url" content="https://buz3xrcbbzd44.mocha.app"/>
    <meta property="og:type" content="website"/>
    <meta property="og:author" content="Mocha"/>
    <meta property="og:site_name" content="Flow"/>
    <meta property="twitter:card" content="summary_large_image"/>
    <meta property="twitter:site" content="@get_mocha"/>
    <meta property="twitter:title" content="Flow"/>
    <meta property="twitter:description" content="Controle financeiro inteligente e minimalista"/>
    <meta property="twitter:image" content="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-favicon.png" type="image/png"/>
    
    <!-- Favicon e ícones para área de trabalho -->
    <link rel="icon" type="image/png" sizes="16x16" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <link rel="icon" type="image/png" sizes="32x32" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <link rel="shortcut icon" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png" type="image/png"/>
    
    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" sizes="57x57" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <link rel="apple-touch-icon" sizes="60x60" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <link rel="apple-touch-icon" sizes="72x72" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <link rel="apple-touch-icon" sizes="76x76" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <link rel="apple-touch-icon" sizes="114x114" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <link rel="apple-touch-icon" sizes="120x120" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <link rel="apple-touch-icon" sizes="144x144" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <link rel="apple-touch-icon" sizes="152x152" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <link rel="apple-touch-icon" sizes="180x180" href="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json"/>
    
    <!-- Microsoft Tiles -->
    <meta name="msapplication-TileColor" content="#14b8a6"/>
    <meta name="msapplication-TileImage" content="https://mocha-cdn.com/0199415b-a577-7e0a-8fa3-4402674c843b/new-minimalist-favicon.png"/>
    <meta name="msapplication-config" content="/browserconfig.xml"/>
    
    <!-- Chrome/Android -->
    <meta name="mobile-web-app-capable" content="yes"/>
    <meta name="application-name" content="Flow"/>
    
    <!-- Safari -->
    <meta name="apple-mobile-web-app-capable" content="yes"/>
    <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
    <meta name="apple-mobile-web-app-title" content="Flow"/>
    
    <title>
      Flow
    </title>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="crossorigin"/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
  </head>
  <body>
    <div id="root">
    </div>
    <script type="module" src="/src/react-app/main.tsx">
    </script>
  </body>
</html>`);
});

export default {
  fetch: app.fetch.bind(app),
};
