# Firebase para Fernando Lucoco Music

## Decisão

Vamos substituir a tentativa de integração Supabase por Firebase. O Firebase não é necessariamente melhor em todos os cenários, mas é uma escolha adequada para este projecto porque o utilizador já o conhece e porque oferece autenticação, base de dados e storage com uma consola integrada. O motor de áudio continua local no browser através de Web Audio API e IndexedDB; o Firebase será usado para identidade, sincronização de projectos, perfis e ficheiros publicados.

> O site continuará a ser Fernando Lucoco Music. Os utilizadores finais não precisam de entrar no Manus; entrarão directamente no teu site através do Firebase Authentication.

## Aviso de custos

O Firebase tem o plano Spark sem custo para vários serviços e quotas limitadas. As regras de preço podem mudar e o Cloud Storage pode exigir o plano Blaze em determinados projectos, regiões ou configurações. Antes de activar Storage, verifica a página de billing apresentada pela própria consola e não adiciona um cartão sem compreender a possibilidade de cobrança. Para preservar o orçamento de 0 €, a primeira versão deve sincronizar apenas manifestos pequenos e manter os ficheiros de áudio grandes no dispositivo; o upload de media fica bloqueado até confirmar os requisitos de billing.

## Parte 1 — criar o projecto

1. Abre https://console.firebase.google.com/ no teu navegador.
2. Entra com a conta Google que queres associar ao Fernando Lucoco Music.
3. Toca em **Create a project / Criar projecto**.
4. Usa o nome `fernando-lucoco-music`.
5. Se aparecer a opção Google Analytics, podes escolher **Not now / Agora não** para simplificar a configuração inicial.
6. Toca em **Create project / Criar projecto** e aguarda a conclusão.

Não precisas de criar outro projecto Supabase. O projecto Firebase passa a ser a fundação de contas, perfis e persistência.

## Parte 2 — registar a aplicação web

1. No painel do Firebase, abre o projecto novo.
2. Na página inicial, escolhe o ícone **Web** (`</>`), em **Your apps / As tuas aplicações**.
3. Em **App nickname**, escreve `Fernando Lucoco Music Web`.
4. Não actives Firebase Hosting agora; o site continuará publicado no Vercel.
5. Toca em **Register app / Registar aplicação**.
6. O Firebase mostrará um objecto `firebaseConfig` com `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` e `appId`.

A configuração web do Firebase pode ser usada no browser; ela identifica o projecto, mas não substitui as regras de segurança. Nunca coloques no browser uma chave de service account, um ficheiro JSON de Admin SDK ou uma credencial privada.

## Parte 3 — activar Authentication

1. No menu esquerdo, abre **Build → Authentication**.
2. Toca em **Get started / Começar**.
3. Em **Sign-in method / Método de início de sessão**, activa primeiro **Email/Password**.
4. Se quiseres login Google, activa também **Google**, escolhe o email de suporte e guarda.
5. Em **Settings → Authorized domains / Domínios autorizados**, confirma que aparecem `localhost` e o domínio Vercel do projecto: `fernando-lucoco-music.vercel.app`.
6. Se tiveres um domínio próprio, adiciona-o nessa lista antes de o utilizares para login.

O fluxo inicial será criar conta, iniciar sessão, terminar sessão e recuperar a sessão ao recarregar. A recuperação de password pode ser adicionada antes da publicação pública.

## Parte 4 — criar o Cloud Firestore

1. Abre **Build → Firestore Database**.
2. Toca em **Create database / Criar base de dados**.
3. Escolhe **Production mode / Modo de produção**; não uses regras abertas.
4. Escolhe uma localização próxima dos utilizadores principais. A localização não deve ser alterada casualmente depois de criada.
5. Conclui a criação.

O modelo inicial será:

```text
users/{uid}
  displayName
  username
  bio
  avatarUrl
  createdAt
  updatedAt

users/{uid}/projects/{projectId}
  name
  description
  visibility: private | unlisted | public
  status: draft | archived
  manifest
  createdAt
  updatedAt
```

O campo `manifest` conterá apenas o estado serializável do Studio, como BPM, tonalidade, tracks, clips, presets e referências locais. Os bytes de áudio grandes não devem ser guardados directamente no Firestore.

## Parte 5 — regras iniciais do Firestore

No Firestore, abre o separador **Rules / Regras**, substitui as regras de teste pelo conteúdo abaixo e toca em **Publish / Publicar**:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function ownsUser(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    function validProject(data) {
      return data.name is string
        && data.name.size() >= 1
        && data.name.size() <= 160
        && data.description is string
        && data.description.size() <= 2000
        && data.visibility in ['private', 'unlisted', 'public']
        && data.status in ['draft', 'archived']
        && data.manifest is map;
    }

    match /users/{userId} {
      allow read, create, update: if ownsUser(userId);
      allow delete: if false;

      match /projects/{projectId} {
        allow read: if ownsUser(userId)
          || (signedIn() && resource.data.visibility == 'public');
        allow create: if ownsUser(userId) && validProject(request.resource.data);
        allow update: if ownsUser(userId) && validProject(request.resource.data);
        allow delete: if ownsUser(userId);
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Estas regras dão ao utilizador acesso ao seu próprio perfil e projectos. Um projecto público pode ser lido por utilizadores autenticados, mas apenas o proprietário pode criar, alterar ou apagar. O feed público será refinado depois com paginação e regras próprias.

## Parte 6 — activar Storage com cuidado

1. Abre **Build → Storage**.
2. Antes de tocar em **Get started**, verifica o plano de billing apresentado.
3. Se a consola exigir Blaze ou cartão, pára nesta etapa e não adiciona dados de pagamento sem confirmação.
4. Para a primeira versão a custo zero, mantém os beats e gravações no IndexedDB local e sincroniza apenas manifestos no Firestore.
5. Quando o storage estiver aprovado, os caminhos deverão seguir este formato:

```text
users/{uid}/audio/{projectId}/{assetId}.wav
users/{uid}/covers/{projectId}/{assetId}.png
```

Regras iniciais de Storage, apenas quando o serviço estiver activo:

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 80 * 1024 * 1024;
    }
  }
}
```

O limite de 80 MB é um limite de produto para reduzir abuso; deve ser ajustado de acordo com o plano, a duração do áudio e o comportamento real em dispositivos móveis.

## Parte 7 — configuração no site

Depois de criares o projecto e registares a app web, guarda o objecto `firebaseConfig`. Esses valores podem ser usados numa configuração pública do frontend, mas não devem ser confundidos com credenciais administrativas.

Variáveis públicas necessárias no Vercel:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Não são necessárias `FIREBASE_PRIVATE_KEY` ou `FIREBASE_CLIENT_EMAIL` para a primeira versão client-side. Se futuramente houver funções server-side administrativas, essas credenciais deverão ficar apenas no Vercel Server/Functions, nunca no browser.

## Parte 8 — ordem de validação

A validação deve seguir esta ordem: criar uma conta de teste, iniciar sessão, terminar sessão, voltar a iniciar sessão, criar um projecto privado, guardar um manifesto pequeno, recarregar a página e reabrir o projecto. Só depois se testa um projecto público. O Storage de áudio fica para uma fase separada, depois de confirmar os requisitos de cobrança.

## O que não fazer

Não uses regras Firestore com `allow read, write: if true`. Não guardes passwords, tokens de sessão ou áudio binário grande no Firestore. Não coloques Admin SDK JSON no repositório. Não actives upload público sem limites de tamanho, tipo MIME, autorização e estratégia de eliminação. Não assumas que uma quota gratuita é ilimitada.

## Referências oficiais

[1]: https://firebase.google.com/docs/web/setup "Firebase — Add Firebase to your JavaScript project"
[2]: https://firebase.google.com/docs/auth "Firebase — Authentication"
[3]: https://firebase.google.com/docs/firestore/quickstart "Firebase — Get started with Cloud Firestore"
[4]: https://firebase.google.com/docs/firestore/security/get-started "Firebase — Get started with Cloud Firestore Security Rules"
[5]: https://firebase.google.com/docs/storage/security "Firebase — Cloud Storage Security Rules"
[6]: https://firebase.google.com/pricing "Firebase — Pricing"
[7]: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans "Firebase — Pricing plans"
