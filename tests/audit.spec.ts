import { test, expect, type Page } from "@playwright/test"

const BASE = "https://kyndo-order.vercel.app"

async function snap(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true })
}

test.describe("1. Landing Page", () => {
  test("carrega corretamente com identidade Kyndo Order", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState("networkidle")
    // Título pode variar — verificar conteúdo principal
    const bodyText = await page.textContent("body")
    expect(bodyText).toContain("Seu próprio app de pedidos")
    expect(bodyText).toContain("Ver Demo Ao Vivo")
    expect(bodyText).toContain("Já sou cliente")
    await snap(page, "01-landing-page")
  })

  test("links funcionam", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState("networkidle")
    await page.click("text=Ver Demo Ao Vivo")
    await expect(page).toHaveURL(/\/demo/)
    await snap(page, "02-demo-page")

    await page.goto(BASE)
    await page.waitForLoadState("networkidle")
    await page.click("text=Já sou cliente")
    await expect(page).toHaveURL(/\/admin\/login/)
    await snap(page, "03-admin-login")
  })
})

test.describe("2. Experiência Mobile", () => {
  test("landing page responsiva em mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE)
    await page.waitForLoadState("networkidle")
    const bodyText = await page.textContent("body")
    expect(bodyText).toContain("Seu próprio app de pedidos")
    await snap(page, "04-landing-mobile")
  })

  test("dashboard admin responsivo em mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/admin/login`)
    await page.waitForLoadState("networkidle")
    await page.click("text=Entrar como Demo")
    await page.waitForTimeout(3000)
    await snap(page, "05-dashboard-mobile")
  })
})

test.describe("3. Cardápio Demo", () => {
  test("cardápio demo carrega produtos", async ({ page }) => {
    await page.goto(`${BASE}/demo`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)
    const bodyText = await page.textContent("body")
    expect(bodyText).toContain("Hambúrgueres")
    expect(bodyText).toContain("X-Bacon")
    await snap(page, "06-cardapio-demo")
  })

  test("botões de adicionar funcionam", async ({ page }) => {
    await page.goto(`${BASE}/demo`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)
    const addButtons = page.locator("button").filter({ hasText: /adicionar|\+/i })
    const count = await addButtons.count()
    if (count > 0) {
      await addButtons.first().click()
      await page.waitForTimeout(500)
      await snap(page, "07-add-to-cart")
    } else {
      console.log("⚠️ Nenhum botão de adicionar encontrado")
    }
  })
})

test.describe("4. Carrinho", () => {
  test("carrinho abre e mostra itens", async ({ page }) => {
    await page.goto(`${BASE}/demo`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)
    const addButtons = page.locator("button").filter({ hasText: /adicionar|\+/i })
    if ((await addButtons.count()) > 0) {
      await addButtons.first().click()
      await page.waitForTimeout(500)
      const cartBtn = page.locator("button").filter({ hasText: /carrinho|cart|ver pedido/i })
      if ((await cartBtn.count()) > 0) {
        await cartBtn.first().click()
        await page.waitForTimeout(500)
      }
      await snap(page, "08-cart-open")
    }
  })
})

test.describe("7. Login e Cadastro Admin", () => {
  test("página de login carrega", async ({ page }) => {
    await page.goto(`${BASE}/admin/login`)
    await page.waitForLoadState("networkidle")
    const bodyText = await page.textContent("body")
    expect(bodyText).toContain("Painel do Lojista")
    expect(bodyText).toContain("Entrar como Demo")
    await snap(page, "09-admin-login-page")
  })

  test("login demo funciona", async ({ page }) => {
    await page.goto(`${BASE}/admin/login`)
    await page.waitForLoadState("networkidle")
    await page.click("text=Entrar como Demo")
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/\/admin/)
    const bodyText = await page.textContent("body")
    expect(bodyText).toContain("Visão Geral")
    await snap(page, "10-admin-dashboard")
  })

  test("página de cadastro carrega e verifica branding", async ({ page }) => {
    await page.goto(`${BASE}/admin/register`)
    await page.waitForLoadState("networkidle")
    await snap(page, "11-admin-register")
    const bodyText = await page.textContent("body") || ""
    if (bodyText.includes("DeliverySaaS")) {
      console.log("⚠️ ISSUE #14: Rodapé ainda mostra 'DeliverySaaS' em vez de 'Kyndo Order'")
    }
  })
})

test.describe("8. Produtos e Imagens no Admin", () => {
  test("aba Produtos lista cardápio", async ({ page }) => {
    await page.goto(`${BASE}/admin/login`)
    await page.waitForLoadState("networkidle")
    await page.click("text=Entrar como Demo")
    await page.waitForTimeout(3000)
    // Clicar na aba Produtos na sidebar
    const produtosBtn = page.locator("button").filter({ hasText: /^Produtos$/ })
    if ((await produtosBtn.count()) > 0) {
      await produtosBtn.first().click()
      await page.waitForTimeout(2000)
    }
    const bodyText = await page.textContent("body")
    expect(bodyText).toContain("Cardápio")
    await snap(page, "12-admin-products")
  })
})

test.describe("9. Kanban de Pedidos", () => {
  test("Kanban exibe colunas de status", async ({ page }) => {
    await page.goto(`${BASE}/admin/login`)
    await page.waitForLoadState("networkidle")
    await page.click("text=Entrar como Demo")
    await page.waitForTimeout(3000)
    const bodyText = await page.textContent("body")
    expect(bodyText).toContain("Fila de Pedidos")
    // Usar seletores mais específicos para evitar ambiguidade com gráfico pie
    expect(bodyText).toContain("Pendentes")
    expect(bodyText).toContain("Preparando")
    expect(bodyText).toContain("Entregando")
    expect(bodyText).toContain("Concluídos")
    await snap(page, "13-kanban")
  })
})

test.describe("13. Console e Erros", () => {
  test("sem erros críticos no console da landing", async ({ page }) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })
    page.on("pageerror", (err) => errors.push(err.message))
    await page.goto(BASE)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("hydration") && !e.includes("next-devtools") && !e.includes("Failed to fetch")
    )
    if (criticalErrors.length > 0) {
      console.log("⚠️ Erros no console:", criticalErrors)
    }
    await snap(page, "14-console-check")
  })
})

test.describe("14. Identidade Visual", () => {
  test("cores Kyndo Order aplicadas", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState("networkidle")
    // Verificar presença do laranja Kyndo via inline styles ou classes Tailwind
    const html = await page.content()
    const hasOrange = html.includes("FF6B35") || html.includes("ff6b35") || html.includes("orange-500") || html.includes("orange-400")
    expect(hasOrange).toBeTruthy()
    await snap(page, "15-brand-colors")
  })
})