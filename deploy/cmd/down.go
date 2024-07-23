package cmd

import (
	"github.com/spf13/cobra"
	hosts "github.com/unstoppablemango/hosts/deploy/internal"
)

func init() {
	rootCmd.AddCommand(downCmd)
}

var downCmd = &cobra.Command{
	Use:     "down",
	Aliases: []string{"d"},
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx := cmd.Context()

		root, err := hosts.RepoPath()
		if err != nil {
			return err
		}

		workspace, err := hosts.NewWorkspace(ctx, &hosts.WorkspaceOptions{
			Root:   root,
			Logger: log,
		})
		if err != nil {
			return err
		}

		log.Debug("Creating host")
		host, err := workspace.GetHost(ctx, "pik8s4")
		if err != nil {
			return err
		}

		log.Info("Destroying host")
		return host.Down(ctx)
	},
}
