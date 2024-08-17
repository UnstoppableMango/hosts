package hosts

import (
	"context"

	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
)

type App struct {
	Opts     DeployOpts
	Context  context.Context
	viewport viewport.Model
	cursor   int
	choices  []string
	selected map[int]struct{}
}

func NewApp(ctx context.Context, opts DeployOpts) *App {
	vp := viewport.New(50, 25)
	vp.SetContent(`Welcome to the chat room!
Type a message and press Enter to send.`)

	return &App{
		Opts:     opts,
		Context:  ctx,
		viewport: vp,
		cursor:   0,
		choices:  []string{"idk", "yeet", "fuck"},
		selected: map[int]struct{}{},
	}
}

// Init implements tea.Model.
func (a *App) Init() tea.Cmd {
	return tea.SetWindowTitle("UnstoppableMango's Server Shit")
}

// Update implements tea.Model.
func (a *App) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var (
		vpCmd tea.Cmd
	)

	a.viewport, vpCmd = a.viewport.Update(msg)

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc", "ctrl+c":
			return a, tea.Quit
		case "up", "k":
			if a.cursor > 0 {
				a.cursor--
			}
		case "down", "j":
			if a.cursor < len(a.choices)-1 {
				a.cursor++
			}
		case "enter", " ":
			_, ok := a.selected[a.cursor]
			if ok {
				delete(a.selected, a.cursor)
			} else {
				a.selected[a.cursor] = struct{}{}
			}
		}
	}

	return a, vpCmd
}

// View implements tea.Model.
func (a *App) View() string {
	a.viewport.SetContent("This is column 1")

	return a.viewport.View()
}

var _ tea.Model = &App{}
