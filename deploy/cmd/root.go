package cmd

import (
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/spf13/cobra"
	hosts "github.com/unstoppablemango/hosts/deploy/internal"
)

var (
	log           = hosts.NewLogger()
	controlplanes = []string{"pik8s4", "pik8s5", "pik8s6"}
	workers       = []string{"zeus", "gaea", "vrk8s1", "pik8s8"}
	cp, wk        bool
)

var rootCmd = &cobra.Command{
	Use:       "deploy [op]",
	Args:      cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
	ValidArgs: []string{"down", "preview", "up"},
	Example:   "deploy up --cp",
	RunE: func(cmd *cobra.Command, args []string) error {
		app := hosts.NewApp(cmd.Context(), hosts.DeployOpts{
			Op:            hosts.Op(args[0]),
			ControlPlanes: controlplanes,
			Workers:       workers,
			Logger:        log,
		})

		_, err := tea.NewProgram(app,
			tea.WithAltScreen(),
		).Run()

		return err
	},
}

func Execute() {
	rootCmd.Flags().BoolVar(&cp, "cp", false, "Only operate on controlplanes")
	rootCmd.Flags().BoolVar(&wk, "wk", false, "Only operate on workers")

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
